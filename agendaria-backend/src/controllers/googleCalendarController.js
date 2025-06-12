// src/controllers/googleCalendarController.js
const googleCalendarService = require('../services/googleCalendarService');
const db = require('../models');

class GoogleCalendarController {
  /**
   * Redireciona o usuário para a página de autorização do Google.
   * Só permite que funcionários ou admins conectem seus calendários.
   */
  async connectGoogleCalendar(request, reply) {
    const { userId, role } = request.user; // Usuário logado

    if (role === 'client') {
      return reply.code(403).send({ error: 'Forbidden', message: 'Clients cannot connect Google Calendar through this endpoint.' });
    }

    const authUrl = googleCalendarService.generateAuthUrl();
    reply.redirect(authUrl); // Redireciona o navegador do usuário
  }

  /**
   * Callback para o OAuth 2.0 do Google.
   * O Google redireciona para cá após o usuário autorizar.
   */
  async oauth2callback(request, reply) {
    const { code, state } = request.query; // 'state' pode ser usado para CSRF, mas não implementado aqui.
    const { userId } = request.user; // O userId é necessário aqui, mas como o OAuth redireciona, não estará no request.user diretamente.
                                   // Solução: O 'state' poderia carregar o userId, ou o frontend passaria o userId de volta para o backend.
                                   // Por simplicidade, assumimos que o userId pode ser passado na URL de callback ou de alguma forma.
                                   // Para um fluxo real, o frontend iniciaria a requisição de autenticação e passaria o userId.
                                   // Para fins de teste inicial, vamos fazer uma gambiarra: o estado do OAuth pode ser uma URL que inclua o userId,
                                   // ou o usuário faz uma requisição POST com o código e seu token.
                                   // Vamos simplificar aqui e assumir que o frontend irá chamar esta rota com o código e um token do usuário logado.

    // **NOTA DE IMPLEMENTAÇÃO:** O Google redireciona com o 'code' em uma URL de GET.
    // Se você quer que o `request.user` esteja disponível aqui (o que é ideal para saber quem está conectando),
    // o frontend precisaria enviar esse `code` para uma rota POST/PUT no seu backend,
    // com o token JWT do usuário logado no `Authorization` header.
    // A rota `/api/google-calendar/oauth2callback` como callback direto do Google geralmente não terá o JWT.

    // **Alternativa:** O frontend inicia `/api/google-calendar/connect` que gera a URL do Google.
    // O usuário autoriza. O Google redireciona para `http://localhost:3000/api/google-calendar/oauth2callback?code=XXX`.
    // O frontend (ou a URL de callback) capta esse `code` e FAZ UMA NOVA REQUISIÇÃO (POST) para
    // `/api/google-calendar/save-tokens` enviando o `code` no body e seu `Authorization` token.
    // Esta é a abordagem mais segura e comum.

    // Para fins de demonstração, vou criar um endpoint onde o frontend envia o código.
    // Não vamos usar o `oauth2callback` como um endpoint direto de redirecionamento do Google aqui.
    // O método `connectGoogleCalendar` apenas geraria a URL.
    // O frontend então abriria essa URL, receberia o callback do Google e FARIA UMA REQUISIÇÃO PARA O BACKEND.
    // Para simplificar, vamos remover o `oauth2callback` como uma rota direta e ter apenas `saveTokens`.
    reply.code(200).send({ message: 'Callback received. Code should be exchanged by frontend.' }); // Temporário
  }

  /**
   * Salva os tokens do Google Calendar para o usuário logado.
   * O frontend envia o 'code' de autorização aqui.
   * Requer autenticação do usuário.
   */
  async saveGoogleCalendarTokens(request, reply) {
    try {
      const { code } = request.body;
      const { userId, role } = request.user;

      if (role === 'client') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Clients cannot link Google Calendar through this endpoint.' });
      }

      const updatedUser = await googleCalendarService.getTokensAndSave(code, userId);
      reply.code(200).send({ message: 'Google Calendar linked successfully', user: updatedUser });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  /**
   * Desconecta o Google Calendar do usuário.
   */
  async disconnectGoogleCalendar(request, reply) {
    try {
      const { userId, role } = request.user;

      if (role === 'client') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Clients cannot unlink Google Calendar through this endpoint.' });
      }

      const user = await db.User.findByPk(userId);
      if (!user) {
        return reply.code(404).send({ error: 'User not found.' });
      }

      await user.update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry_date: null,
      });

      reply.code(200).send({ message: 'Google Calendar unlinked successfully.' });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}

module.exports = new GoogleCalendarController();