// src/services/employeeAvailabilityService.js
const db = require('../models');
const EmployeeAvailability = db.EmployeeAvailability;
const User = db.User;
const Company = db.Company;
const CompanyEmployee = db.CompanyEmployee;
const { Op } = require('sequelize'); // Para operações de comparação de data/hora

class EmployeeAvailabilityService {
  /**
   * Cria uma nova disponibilidade para um funcionário.
   * Pode ser feito pelo próprio funcionário ou pelo admin (dono da empresa do funcionário).
   * @param {string} employeeId - ID do funcionário para quem a disponibilidade será criada.
   * @param {Object} availabilityData - Dados da disponibilidade (day_of_week, start_time, end_time, etc.).
   * @param {string} requestingUserId - ID do usuário fazendo a requisição.
   * @returns {Promise<EmployeeAvailability>} A disponibilidade criada.
   * @throws {Error} Se o funcionário não for encontrado, o usuário não tiver permissão, ou houver conflito de horário.
   */
  async createAvailability(employeeId, availabilityData, requestingUserId) {
    const employee = await User.findByPk(employeeId);
    if (!employee || !['admin', 'employee'].includes(employee.role)) {
      const error = new Error('Employee not found or invalid role for availability management.');
      error.statusCode = 404;
      throw error;
    }

    // Autorização: O solicitante deve ser o próprio funcionário OU um admin dono da empresa do funcionário
    const isSelf = requestingUserId === employeeId;
    let isOwnerOfEmployeeCompany = false;

    if (!isSelf && employee.role === 'employee') { // Se não é o próprio, verifica se é admin da empresa do funcionário
      // Buscar empresas onde este 'employeeId' é funcionário aceito
      const employeeCompanies = await CompanyEmployee.findAll({
        where: { employee_id: employeeId, status: 'accepted' }
      });

      // Verificar se o requestingUserId é owner de alguma dessas empresas
      for (const empCompany of employeeCompanies) {
        const company = await Company.findByPk(empCompany.company_id);
        if (company && company.owner_id === requestingUserId) {
          isOwnerOfEmployeeCompany = true;
          break;
        }
      }
    } else if (!isSelf && employee.role === 'admin') {
      // Se um admin tenta gerenciar outro admin (que não é seu funcionário), pode ser necessário uma regra.
      // Por simplicidade, assumimos que só o dono pode gerenciar a si ou seus employees.
      if (requestingUserId !== employee.id) {
          const error = new Error('Unauthorized: Admin can only manage their own availability or employees\' availability.');
          error.statusCode = 403;
          throw error;
      }
    }


    if (!isSelf && !isOwnerOfEmployeeCompany) {
      const error = new Error('Unauthorized: You are not authorized to manage this employee\'s availability.');
      error.statusCode = 403;
      throw error;
    }

    // Validação de horário (start_time < end_time) já está no modelo Sequelize.
    // Lógica para verificar sobreposição de horários (mais complexo para recorrência e datas efetivas)
    // Por simplicidade inicial, vamos permitir sobreposição, mas em um sistema real, seria mais robusto.
    // Ou, podemos verificar apenas conflitos diretos para o mesmo dia e datas.
    // Exemplo básico de conflito no mesmo dia (sem considerar effective/expiration_date complexa):
    const { day_of_week, start_time, end_time, effective_date, expiration_date, is_recurring } = availabilityData;

    const existingAvailabilities = await EmployeeAvailability.findAll({
      where: {
        employee_id: employeeId,
        day_of_week,
        // Lógica de sobreposição seria mais complexa aqui, considerando is_recurring e datas
        // Por exemplo:
        // (start_time BETWEEN existing.start_time AND existing.end_time) OR
        // (end_time BETWEEN existing.start_time AND existing.end_time) OR
        // (existing.start_time BETWEEN start_time AND end_time)
      }
    });

    for (const existing of existingAvailabilities) {
        // Exemplo simplificado: se horários se sobrepõem no mesmo dia, independente de datas/recorrência
        const newStart = new Date(`2000-01-01T${start_time}`);
        const newEnd = new Date(`2000-01-01T${end_time}`);
        const existingStart = new Date(`2000-01-01T${existing.start_time}`);
        const existingEnd = new Date(`2000-01-01T${existing.end_time}`);

        // Verifica se há sobreposição de horários
        if (
            (newStart < existingEnd && newEnd > existingStart) // Nova sobrepõe existente
        ) {
            // Mais granularidade seria necessária para datas e recorrencia
            // Por exemplo, se ambos são recorrentes sem datas ou datas se sobrepõem
            if (is_recurring && existing.is_recurring && (!effective_date || !expiration_date || (effective_date <= existing.expiration_date && expiration_date >= existing.effective_date))) {
                 // Conflito de horários recorrentes
                 const error = new Error(`Time slot ${start_time}-${end_time} on day ${day_of_week} conflicts with existing recurring availability.`);
                 error.statusCode = 409;
                 throw error;
            }
            // Para casos de não-recorrentes ou sobreposição parcial, a lógica seria mais complexa.
            // Por agora, este é um bom ponto de partida.
        }
    }


    const availability = await EmployeeAvailability.create({
      ...availabilityData,
      employee_id: employeeId
    });
    return availability.toJSON();
  }

  /**
   * Obtém uma disponibilidade específica.
   * @param {string} availabilityId - ID da disponibilidade.
   * @returns {Promise<EmployeeAvailability|null>} A disponibilidade encontrada ou null.
   */
  async getAvailabilityById(availabilityId) {
    const availability = await EmployeeAvailability.findByPk(availabilityId);
    return availability ? availability.toJSON() : null;
  }

  /**
   * Lista todas as disponibilidades de um funcionário.
   * Acesso para todos os usuários autenticados (para clientes poderem ver horários).
   * @param {string} employeeId - ID do funcionário.
   * @returns {Promise<EmployeeAvailability[]>} Lista de disponibilidades.
   * @throws {Error} Se o funcionário não for encontrado.
   */
  async getEmployeeAvailabilities(employeeId) {
    const employee = await User.findByPk(employeeId);
    if (!employee || !['admin', 'employee', 'client'].includes(employee.role)) { // Clientes também podem ver
      const error = new Error('Employee not found.');
      error.statusCode = 404;
      throw error;
    }
    const availabilities = await EmployeeAvailability.findAll({
      where: { employee_id: employeeId },
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']] // Ordena para melhor visualização
    });
    return availabilities.map(av => av.toJSON());
  }

  /**
   * Atualiza uma disponibilidade existente.
   * Pode ser feito pelo próprio funcionário ou pelo admin (dono da empresa do funcionário).
   * @param {string} employeeId - ID do funcionário (para verificação).
   * @param {string} availabilityId - ID da disponibilidade a ser atualizada.
   * @param {Object} updateData - Dados para atualização.
   * @param {string} requestingUserId - ID do usuário fazendo a requisição.
   * @returns {Promise<EmployeeAvailability|null>} A disponibilidade atualizada ou null se não encontrada/não autorizada.
   * @throws {Error} Se a disponibilidade não for encontrada, não pertencer ao funcionário, ou o usuário não tiver permissão.
   */
  async updateAvailability(employeeId, availabilityId, updateData, requestingUserId) {
    const availability = await EmployeeAvailability.findByPk(availabilityId);

    if (!availability) {
      const error = new Error('Availability not found.');
      error.statusCode = 404;
      throw error;
    }
    if (availability.employee_id !== employeeId) {
      const error = new Error('Availability does not belong to the specified employee.');
      error.statusCode = 400; // Bad request, mismatch between params
      throw error;
    }

    // Autorização: O solicitante deve ser o próprio funcionário OU um admin dono da empresa do funcionário
    const isSelf = requestingUserId === employeeId;
    let isOwnerOfEmployeeCompany = false;

    if (!isSelf) {
      const employee = await User.findByPk(employeeId);
      if (!employee) { // Não deveria acontecer se availability existe
        const error = new Error('Employee associated with availability not found.');
        error.statusCode = 404;
        throw error;
      }
      const employeeCompanies = await CompanyEmployee.findAll({ where: { employee_id: employeeId, status: 'accepted' } });
      for (const empCompany of employeeCompanies) {
        const company = await Company.findByPk(empCompany.company_id);
        if (company && company.owner_id === requestingUserId) {
          isOwnerOfEmployeeCompany = true;
          break;
        }
      }
    }

    if (!isSelf && !isOwnerOfEmployeeCompany) {
      const error = new Error('Unauthorized: You are not authorized to update this employee\'s availability.');
      error.statusCode = 403;
      throw error;
    }

    // Lógica para verificar sobreposição de horários após a atualização (similar à criação)
    // ...

    await availability.update(updateData);
    return availability.toJSON();
  }

  /**
   * Deleta uma disponibilidade.
   * Pode ser feito pelo próprio funcionário ou pelo admin (dono da empresa do funcionário).
   * @param {string} employeeId - ID do funcionário (para verificação).
   * @param {string} availabilityId - ID da disponibilidade a ser deletada.
   * @param {string} requestingUserId - ID do usuário fazendo a requisição.
   * @returns {Promise<boolean>} True se deletado com sucesso.
   * @throws {Error} Se a disponibilidade não for encontrada, não pertencer ao funcionário, ou o usuário não tiver permissão.
   */
  async deleteAvailability(employeeId, availabilityId, requestingUserId) {
    const availability = await EmployeeAvailability.findByPk(availabilityId);

    if (!availability) {
      const error = new Error('Availability not found.');
      error.statusCode = 404;
      throw error;
    }
    if (availability.employee_id !== employeeId) {
      const error = new Error('Availability does not belong to the specified employee.');
      error.statusCode = 400;
      throw error;
    }

    // Autorização (mesma lógica de criação/atualização)
    const isSelf = requestingUserId === employeeId;
    let isOwnerOfEmployeeCompany = false;

    if (!isSelf) {
      const employee = await User.findByPk(employeeId);
      if (!employee) {
        const error = new Error('Employee associated with availability not found.');
        error.statusCode = 404;
        throw error;
      }
      const employeeCompanies = await CompanyEmployee.findAll({ where: { employee_id: employeeId, status: 'accepted' } });
      for (const empCompany of employeeCompanies) {
        const company = await Company.findByPk(empCompany.company_id);
        if (company && company.owner_id === requestingUserId) {
          isOwnerOfEmployeeCompany = true;
          break;
        }
      }
    }

    if (!isSelf && !isOwnerOfEmployeeCompany) {
      const error = new Error('Unauthorized: You are not authorized to delete this employee\'s availability.');
      error.statusCode = 403;
      throw error;
    }

    await availability.destroy();
    return true;
  }
}

module.exports = new EmployeeAvailabilityService();