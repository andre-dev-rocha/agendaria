// src/services/googleCalendarService.js
const { google } = require('googleapis');
const db = require('../models');
const User = db.User;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Define os escopos necessários
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

class GoogleCalendarService {
  /**
   * Gera a URL de autorização do Google.
   * @returns {string} URL para o usuário autorizar.
   */
  generateAuthUrl() {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline', // Para obter um refresh_token
      scope: SCOPES,
      prompt: 'consent' // Garante que o refresh_token seja sempre retornado
    });
  }

  /**
   * Troca o código de autorização por tokens de acesso e refresh.
   * @param {string} code - Código de autorização recebido do Google.
   * @param {string} userId - ID do usuário para quem os tokens serão armazenados.
   * @returns {Promise<User>} O usuário atualizado com os tokens.
   */
  async getTokensAndSave(code, userId) {
    const { tokens } = await oauth2Client.getToken(code);

    // Salva os tokens no banco de dados para o usuário
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    await user.update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token, // Armazenar o refresh_token para uso futuro
      google_token_expiry_date: new Date(tokens.expiry_date),
    });

    // Define as credenciais para o cliente OAuth (para uso imediato)
    oauth2Client.setCredentials(tokens);

    return user.toJSON();
  }

  /**
   * Obtém um cliente OAuth2 com credenciais atualizadas, usando refresh_token se necessário.
   * @param {string} userId - ID do usuário.
   * @returns {Promise<google.auth.OAuth2>} Cliente OAuth2 configurado.
   * @throws {Error} Se tokens não forem encontrados ou falha na atualização.
   */
  async getAuthenticatedClient(userId) {
    const user = await User.findByPk(userId);
    if (!user || !user.google_refresh_token) {
      const error = new Error('Google Calendar not linked for this user.');
      error.statusCode = 400;
      throw error;
    }

    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
      expiry_date: user.google_token_expiry_date ? user.google_token_expiry_date.getTime() : null,
    });

    // Se o access token estiver expirado ou perto de expirar, usa o refresh token
    if (!user.google_token_expiry_date || new Date() >= new Date(user.google_token_expiry_date)) {
        console.log('Access token expired or near expiry. Refreshing...');
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await user.update({
                google_access_token: credentials.access_token,
                google_token_expiry_date: new Date(credentials.expiry_date),
            });
            oauth2Client.setCredentials(credentials);
        } catch (refreshError) {
            console.error('Error refreshing access token:', refreshError.message);
            // Invalida os tokens no DB se o refresh falhar
            await user.update({
                google_access_token: null,
                google_refresh_token: null,
                google_token_expiry_date: null,
            });
            const error = new Error('Failed to refresh Google Calendar token. Please re-link.');
            error.statusCode = 401;
            throw error;
        }
    }
    return oauth2Client;
  }

  /**
   * Adiciona um evento ao Google Calendar do usuário.
   * @param {string} userId - ID do usuário (funcionário).
   * @param {Object} eventDetails - Detalhes do evento (summary, description, start, end).
   * @returns {Promise<string>} ID do evento criado no Google Calendar.
   */
  async createCalendarEvent(userId, eventDetails) {
    const auth = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.start_time, // ISO 8601
        timeZone: 'America/Sao_Paulo', // Ou o fuso horário da empresa/usuário
      },
      end: {
        dateTime: eventDetails.end_time, // ISO 8601
        timeZone: 'America/Sao_Paulo',
      },
      // guest: [
      //    { 'email': 'client_email@example.com' } // Opcional: adicionar o cliente como convidado
      // ]
    };

    const response = await calendar.events.insert({
      calendarId: 'primary', // 'primary' refere-se ao calendário principal do usuário
      resource: event,
    });
    return response.data.id; // Retorna o ID do evento do Google Calendar
  }

  /**
   * Atualiza um evento existente no Google Calendar do usuário.
   * @param {string} userId - ID do usuário (funcionário).
   * @param {string} googleEventId - ID do evento no Google Calendar.
   * @param {Object} updatedDetails - Detalhes atualizados do evento.
   * @returns {Promise<boolean>} True se atualizado com sucesso.
   */
  async updateCalendarEvent(userId, googleEventId, updatedDetails) {
    const auth = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: updatedDetails.summary,
      description: updatedDetails.description,
      start: {
        dateTime: updatedDetails.start_time,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: updatedDetails.end_time,
        timeZone: 'America/Sao_Paulo',
      },
    };

    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      resource: event,
    });
    return true;
  }

  /**
   * Deleta um evento do Google Calendar do usuário.
   * @param {string} userId - ID do usuário (funcionário).
   * @param {string} googleEventId - ID do evento no Google Calendar.
   * @returns {Promise<boolean>} True se deletado com sucesso.
   */
  async deleteCalendarEvent(userId, googleEventId) {
    const auth = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
    return true;
  }
}

module.exports = new GoogleCalendarService();