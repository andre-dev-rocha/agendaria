// src/services/scheduleService.js
const db = require('../models');
const { Op } = require('sequelize'); // Para operadores de consulta
const Schedule = db.Schedule;
const User = db.User;
const Service = db.Service;
const EmployeeAvailability = db.EmployeeAvailability;
const EmployeeService = db.EmployeeService; // Para verificar se o funcionário oferece o serviço
const googleCalendarService = require('./googleCalendarService');

class ScheduleService {
  /**
   * Encontra horários disponíveis para um agendamento.
   * Considera a disponibilidade do funcionário e os agendamentos existentes.
   * @param {string} employeeId - ID do funcionário.
   * @param {string} serviceId - ID do serviço.
   * @param {string} date - Data para verificar disponibilidade (YYYY-MM-DD).
   * @returns {Promise<Array<Object>>} Lista de horários disponíveis (start_time, end_time).
   * @throws {Error} Se funcionário ou serviço não forem encontrados ou o funcionário não oferece o serviço.
   */
  async findAvailableSlots(employeeId, serviceId, date) {
    const employee = await User.findByPk(employeeId);
    if (!employee || !['admin', 'employee'].includes(employee.role)) {
      const error = new Error('Employee not found or not eligible for appointments.');
      error.statusCode = 404;
      throw error;
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      const error = new Error('Service not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verifica se o funcionário oferece o serviço
    const employeeOffersService = await EmployeeService.findOne({
      where: { employee_id: employeeId, service_id: serviceId }
    });
    if (!employeeOffersService) {
      const error = new Error('Employee does not offer this service.');
      error.statusCode = 400;
      throw error;
    }

    const appointmentDuration = service.duration; // Duração do serviço em minutos
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay(); // 0 (Sunday) to 6 (Saturday)

    // 1. Obter a disponibilidade do funcionário para aquele dia da semana
    const availabilities = await EmployeeAvailability.findAll({
      where: {
        employee_id: employeeId,
        day_of_week: dayOfWeek,
        [Op.or]: [ // Condições para effective_date e expiration_date
          {
            is_recurring: true, // Slots recorrentes
            effective_date: { [Op.or]: [{ [Op.eq]: null }, { [Op.lte]: targetDate }] },
            expiration_date: { [Op.or]: [{ [Op.eq]: null }, { [Op.gte]: targetDate }] }
          },
          {
            is_recurring: false, // Slots não recorrentes (datas exatas)
            effective_date: targetDate, // Deve ser na data exata
            expiration_date: targetDate // E expirar na data exata (ou ser nulo, para intervalo de 1 dia)
          }
        ]
      },
      order: [['start_time', 'ASC']]
    });

    if (availabilities.length === 0) {
      return []; // Nenhuma disponibilidade para este dia
    }

    // 2. Obter agendamentos existentes para o funcionário naquele dia
    const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

    const existingAppointments = await Schedule.findAll({
      where: {
        employee_id: employeeId,
        start_time: { [Op.between]: [startOfDay, endOfDay] },
        status: { [Op.in]: ['pending', 'confirmed'] } // Considera apenas agendamentos pendentes ou confirmados
      },
      order: [['start_time', 'ASC']]
    });

    // 3. Calcular os slots disponíveis
    let availableSlots = [];

    for (const availability of availabilities) {
      const avStartHour = parseInt(availability.start_time.substring(0, 2));
      const avStartMinute = parseInt(availability.start_time.substring(3, 5));
      const avEndHour = parseInt(availability.end_time.substring(0, 2));
      const avEndMinute = parseInt(availability.end_time.substring(3, 5));

      let currentSlotStart = new Date(targetDate);
      currentSlotStart.setUTCHours(avStartHour, avStartMinute, 0, 0);

      const avEnd = new Date(targetDate);
      avEnd.setUTCHours(avEndHour, avEndMinute, 0, 0);

      // Lógica para iterar pelos slots
      while (currentSlotStart.getTime() + appointmentDuration * 60 * 1000 <= avEnd.getTime()) {
        const potentialSlotEnd = new Date(currentSlotStart.getTime() + appointmentDuration * 60 * 1000);

        let isConflicting = false;
        for (const appointment of existingAppointments) {
          const apptStart = new Date(appointment.start_time);
          const apptEnd = new Date(appointment.end_time);

          // Verifica se o slot potencial se sobrepõe a um agendamento existente
          if (
            (currentSlotStart < apptEnd && potentialSlotEnd > apptStart)
          ) {
            isConflicting = true;
            // Se houver conflito, o próximo slot potencial deve começar APÓS o término do agendamento conflitante
            if (currentSlotStart < apptEnd) { // Só avança se o agendamento já começou antes do nosso slot
                currentSlotStart = apptEnd; // Move o início do próximo slot para o final do agendamento conflitante
            }
            break; // Sai do loop de agendamentos e tenta o próximo slot
          }
        }

        if (!isConflicting) {
          availableSlots.push({
            start_time: currentSlotStart.toISOString(),
            end_time: potentialSlotEnd.toISOString()
          });
          currentSlotStart = potentialSlotEnd; // Avança para o próximo slot
        } else if (currentSlotStart.getTime() + appointmentDuration * 60 * 1000 <= avEnd.getTime()) {
            // Se houve conflito e currentSlotStart foi avançado, continue o loop com o novo currentSlotStart
            // Senão, currentSlotStart já foi avançado para o final do agendamento conflitante, e o loop while fará a próxima checagem
        }
      }
    }

    return availableSlots;
  }

  /**
   * Cria um novo agendamento.
   * @param {string} clientId - ID do cliente que está agendando.
   * @param {Object} scheduleData - Dados do agendamento (employeeId, serviceId, start_time, notes).
   * @returns {Promise<Schedule>} O agendamento criado.
   * @throws {Error} Se o funcionário/serviço/cliente não forem encontrados, ou não houver disponibilidade.
   */
  async createSchedule(clientId, scheduleData) {
    const { employeeId, serviceId, start_time, notes } = scheduleData;

    const client = await User.findByPk(clientId);
    if (!client || client.role !== 'client') {
      const error = new Error('Client not found or invalid role.');
      error.statusCode = 404;
      throw error;
    }

    const employee = await User.findByPk(employeeId);
    if (!employee || !['admin', 'employee'].includes(employee.role)) {
      const error = new Error('Employee not found or not eligible for appointments.');
      error.statusCode = 404;
      throw error;
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      const error = new Error('Service not found.');
      error.statusCode = 404;
      throw error;
    }

    // Validação extra: verificar se o funcionário oferece o serviço
    const employeeOffersService = await EmployeeService.findOne({
      where: { employee_id: employeeId, service_id: serviceId }
    });
    if (!employeeOffersService) {
      const error = new Error('Employee does not offer this service.');
      error.statusCode = 400;
      throw error;
    }

    const appointmentDuration = service.duration; // Duração em minutos
    const apptStartTime = new Date(start_time);
    const apptEndTime = new Date(apptStartTime.getTime() + appointmentDuration * 60 * 1000); // Calcula end_time

    // 1. Verificar se o slot solicitado está dentro da disponibilidade do funcionário
    const dayOfWeek = apptStartTime.getUTCDay(); // Dia da semana do agendamento

    const relevantAvailabilities = await EmployeeAvailability.findAll({
      where: {
        employee_id: employeeId,
        day_of_week: dayOfWeek,
        [Op.or]: [
          {
            is_recurring: true,
            effective_date: { [Op.or]: [{ [Op.eq]: null }, { [Op.lte]: apptStartTime.toISOString().split('T')[0] }] },
            expiration_date: { [Op.or]: [{ [Op.eq]: null }, { [Op.gte]: apptEndTime.toISOString().split('T')[0] }] }
          },
          {
            is_recurring: false,
            effective_date: apptStartTime.toISOString().split('T')[0],
            expiration_date: apptEndTime.toISOString().split('T')[0]
          }
        ]
      }
    });

    let isWithinAvailability = false;
    for (const av of relevantAvailabilities) {
      const avStart = new Date(apptStartTime.toISOString().split('T')[0] + 'T' + av.start_time);
      const avEnd = new Date(apptStartTime.toISOString().split('T')[0] + 'T' + av.end_time);

      if (apptStartTime >= avStart && apptEndTime <= avEnd) {
        isWithinAvailability = true;
        break;
      }
    }

    if (!isWithinAvailability) {
      const error = new Error('Employee is not available at the requested time or for the full duration of the service.');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // 2. Verificar se o slot solicitado NÃO se sobrepõe a agendamentos existentes
    const conflictingSchedules = await Schedule.findAll({
      where: {
        employee_id: employeeId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        [Op.or]: [
          {
            start_time: { [Op.lt]: apptEndTime, [Op.gte]: apptStartTime } // Início do novo slot dentro de um existente
          },
          {
            end_time: { [Op.gt]: apptStartTime, [Op.lte]: apptEndTime } // Fim do novo slot dentro de um existente
          },
          {
            start_time: { [Op.lte]: apptStartTime }, // Existente engloba novo
            end_time: { [Op.gte]: apptEndTime }
          }
        ]
      }
    });

    if (conflictingSchedules.length > 0) {
      const error = new Error('Requested time slot conflicts with an existing appointment.');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // 3. Criar o agendamento
    const schedule = await Schedule.create({
      client_id: clientId,
      employee_id: employeeId,
      service_id: serviceId,
      start_time: apptStartTime,
      end_time: apptEndTime,
      status: 'pending', // Pode ser 'confirmed' se não houver aprovação manual
      notes: notes
    });

    // TODO: Notificação para funcionário sobre novo agendamento
  try {
    const clientUser = await User.findByPk(clientId); // Para pegar o email do cliente
    const employeeUser = await User.findByPk(employeeId); // Para pegar o email do funcionário e tokens

    if (employeeUser && employeeUser.google_refresh_token) { // Só cria se o funcionário conectou o GC
      const googleEventId = await googleCalendarService.createCalendarEvent(employeeId, {
        summary: `${service.name} com ${clientUser.name}`,
        description: `Serviço: ${service.name}\nCliente: <span class="math-inline">\{clientUser\.name\} \(</span>{clientUser.email})\nNotas: ${notes || 'Nenhuma'}`,
        start_time: apptStartTime.toISOString(), // ISO 8601
        end_time: apptEndTime.toISOString(),   // ISO 8601
        // guests: [{ email: clientUser.email }] // Adicionar o cliente como convidado (opcional)
      });

      // Salva o ID do evento do Google Calendar no agendamento para futuras atualizações/deletes
      await schedule.update({ google_calendar_event_id: googleEventId });
    }
  } catch (gcError) {
    console.error('Error creating Google Calendar event:', gcError.message);
    // Opcional: Lidar com o erro de forma mais sofisticada, talvez registrar,
    // ou notificar o funcionário que a sincronização falhou.
    // O agendamento na sua DB ainda será criado.
  }

    return schedule.toJSON();
  }

  /**
   * Lista os agendamentos de um cliente.
   * @param {string} clientId - ID do cliente logado.
   * @returns {Promise<Schedule[]>} Lista de agendamentos do cliente.
   */
  async getClientSchedules(clientId) {
    const schedules = await Schedule.findAll({
      where: { client_id: clientId },
      include: [
        { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'duration', 'price'] }
      ],
      order: [['start_time', 'ASC']]
    });
    return schedules.map(s => s.toJSON());
  }

  /**
   * Lista os agendamentos de um funcionário.
   * @param {string} employeeId - ID do funcionário logado.
   * @returns {Promise<Schedule[]>} Lista de agendamentos do funcionário.
   */
  async getEmployeeSchedules(employeeId) {
    const schedules = await Schedule.findAll({
      where: { employee_id: employeeId },
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'duration', 'price'] }
      ],
      order: [['start_time', 'ASC']]
    });
    return schedules.map(s => s.toJSON());
  }

  /**
   * Lista os agendamentos de uma empresa (para o dono/admin).
   * @param {string} companyId - ID da empresa.
   * @param {string} ownerId - ID do dono da empresa.
   * @returns {Promise<Schedule[]>} Lista de agendamentos da empresa.
   * @throws {Error} Se a empresa não for encontrada ou o usuário não for o dono.
   */
  async getCompanySchedules(companyId, ownerId) {
    const company = await db.Company.findByPk(companyId);
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }
    if (company.owner_id !== ownerId) {
      const error = new Error('Unauthorized: You do not own this company.');
      error.statusCode = 403;
      throw error;
    }

    // Buscar todos os employees aceitos desta empresa
    const employeeIds = (await db.CompanyEmployee.findAll({
      where: { company_id: companyId, status: 'accepted' },
      attributes: ['employee_id']
    })).map(ce => ce.employee_id);

    if (employeeIds.length === 0) {
        return []; // Nao ha funcionarios aceitos para esta empresa
    }

    const schedules = await Schedule.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds }
      },
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'duration', 'price'] }
      ],
      order: [['start_time', 'ASC']]
    });
    return schedules.map(s => s.toJSON());
  }


  /**
   * Atualiza o status de um agendamento (cancelar, confirmar, completar).
   * Pode ser feito pelo cliente (cancelar), funcionário (confirmar, completar, cancelar), ou admin (todos).
   * @param {string} scheduleId - ID do agendamento.
   * @param {string} newStatus - Novo status ('pending', 'confirmed', 'canceled', 'completed').
   * @param {string} requestingUserId - ID do usuário logado.
   * @param {string} requestingUserRole - Papel do usuário logado.
   * @returns {Promise<Schedule|null>} O agendamento atualizado.
   * @throws {Error} Se o agendamento não for encontrado, o status for inválido ou o usuário não tiver permissão.
   */
  async updateScheduleStatus(scheduleId, newStatus, requestingUserId, requestingUserRole) {
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      const error = new Error('Schedule not found.');
      error.statusCode = 404;
      throw error;
    }

    // Regras de transição de status (ex: não pode ir de canceled para confirmed)
    const validTransitions = {
        'pending': ['confirmed', 'canceled'],
        'confirmed': ['completed', 'canceled'],
        'completed': [], // Não pode mudar depois de completo
        'canceled': []   // Não pode mudar depois de cancelado
    };

    if (!validTransitions[schedule.status] || !validTransitions[schedule.status].includes(newStatus)) {
        const error = new Error(`Invalid status transition from ${schedule.status} to ${newStatus}.`);
        error.statusCode = 400;
        throw error;
    }

    // Autorização para mudança de status
    const isClient = requestingUserId === schedule.client_id && requestingUserRole === 'client';
    const isEmployee = requestingUserId === schedule.employee_id && ['employee', 'admin'].includes(requestingUserRole); // admin pode ser employee
    const isOwner = requestingUserRole === 'admin'; // Admin pode gerenciar qualquer agendamento em suas empresas

    let authorized = false;

    if (isClient && newStatus === 'canceled') { // Cliente só pode cancelar o próprio agendamento
        authorized = true;
    } else if (isEmployee && ['confirmed', 'completed', 'canceled'].includes(newStatus)) { // Funcionário pode confirmar, completar, cancelar os seus
        authorized = true;
    } else if (isOwner) { // Admin pode fazer qualquer transição
        // Para admin, verificar se ele é owner da empresa
        const employeeCompany = await CompanyEmployee.findOne({
            where: { employee_id: schedule.employee_id, status: 'accepted' },
            include: [{ model: Company, as: 'Company', where: { owner_id: requestingUserId } }]
        });
        if (employeeCompany) {
            authorized = true;
        } else {
            const error = new Error('Unauthorized: Admin does not own the company associated with this employee.');
            error.statusCode = 403;
            throw error;
        }
    }

    if (!authorized) {
      const error = new Error('Unauthorized to update this schedule status.');
      error.statusCode = 403;
      throw error;
    }

    await schedule.update({ status: newStatus });

  // **INTEGRAÇÃO COM GOOGLE CALENDAR (NOVO)**
  try {
    const employeeUser = await User.findByPk(schedule.employee_id);
    const service = await Service.findByPk(schedule.service_id);
    const clientUser = await User.findByPk(schedule.client_id);

    if (employeeUser && employeeUser.google_refresh_token && schedule.google_calendar_event_id) {
      if (newStatus === 'canceled' || newStatus === 'completed') {
        // Se o agendamento foi cancelado ou completado, deleta ou marca como busy no Google Calendar
        await googleCalendarService.deleteCalendarEvent(employeeUser.id, schedule.google_calendar_event_id);
        // Opcional: Você pode querer apenas ATUALIZAR o evento no GC com um status 'Canceled'
        // Em vez de deletar, atualizaria o título ou a descrição para indicar o cancelamento.
        // Isso depende da preferência. Deletar é mais limpo.
      } else {
        // Se o status mudou para 'confirmed' (de 'pending'), ou outro update que não seja cancel/complete
        // atualiza o evento. Por exemplo, se adicionamos notas, etc.
        // Para simplicidade, vamos atualizar para 'confirmed' ou outras mudanças nos detalhes.
        // Se o status já era 'confirmed' e agora mudou, por exemplo, de 'pending' para 'confirmed'
        if (oldStatus === 'pending' && newStatus === 'confirmed') {
            await googleCalendarService.updateCalendarEvent(employeeUser.id, schedule.google_calendar_event_id, {
                summary: `${service.name} (Confirmado) com ${clientUser.name}`,
                description: `Serviço: ${service.name}\nCliente: <span class="math-inline">\{clientUser\.name\} \(</span>{clientUser.email})\nNotas: ${schedule.notes || 'Nenhuma'}\nStatus: Confirmado`,
                start_time: schedule.start_time.toISOString(),
                end_time: schedule.end_time.toISOString(),
            });
        }
      }
    }
  } catch (gcError) {
    console.error('Error updating Google Calendar event:', gcError.message);
  }

    return schedule.toJSON();
  }

  /**
   * Deleta um agendamento.
   * Pode ser feito pelo cliente (se pendente), funcionário ou admin.
   * @param {string} scheduleId - ID do agendamento.
   * @param {string} requestingUserId - ID do usuário logado.
   * @param {string} requestingUserRole - Papel do usuário logado.
   * @returns {Promise<boolean>} True se deletado com sucesso.
   * @throws {Error} Se o agendamento não for encontrado ou o usuário não tiver permissão.
   */
  async deleteSchedule(scheduleId, requestingUserId, requestingUserRole) {
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      const error = new Error('Schedule not found.');
      error.statusCode = 404;
      throw error;
    }

    const isClient = requestingUserId === schedule.client_id && requestingUserRole === 'client';
    const isEmployee = requestingUserId === schedule.employee_id && ['employee', 'admin'].includes(requestingUserRole);
    const isOwner = requestingUserRole === 'admin';

    let authorized = false;

    if (isClient && schedule.status === 'pending') { // Cliente só pode deletar agendamentos pendentes
        authorized = true;
    } else if (isEmployee) { // Funcionário pode deletar
        authorized = true;
    } else if (isOwner) { // Admin pode deletar
        const employeeCompany = await CompanyEmployee.findOne({
            where: { employee_id: schedule.employee_id, status: 'accepted' },
            include: [{ model: Company, as: 'Company', where: { owner_id: requestingUserId } }]
        });
        if (employeeCompany) {
            authorized = true;
        } else {
            const error = new Error('Unauthorized: Admin does not own the company associated with this employee.');
            error.statusCode = 403;
            throw error;
        }
    }

    if (!authorized) {
      const error = new Error('Unauthorized to delete this schedule.');
      error.statusCode = 403;
      throw error;
    }

  // **INTEGRAÇÃO COM GOOGLE CALENDAR (NOVO)**
  try {
    const employeeUser = await User.findByPk(schedule.employee_id);
    if (employeeUser && employeeUser.google_refresh_token && schedule.google_calendar_event_id) {
      await googleCalendarService.deleteCalendarEvent(employeeUser.id, schedule.google_calendar_event_id);
    }
  } catch (gcError) {
    console.error('Error deleting Google Calendar event:', gcError.message);
  }

    await schedule.destroy();
    return true;
  }
}

module.exports = new ScheduleService();