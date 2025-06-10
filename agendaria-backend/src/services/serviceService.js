// src/services/serviceService.js
const db = require('../models');
const Service = db.Service;
const Company = db.Company; // Necessário para verificar a propriedade da empresa

class ServiceService {
  /**
   * Cria um novo serviço para uma empresa.
   * @param {string} companyId - ID da empresa à qual o serviço pertence.
   * @param {Object} serviceData - Dados do serviço (name, duration, price, description).
   * @param {string} ownerId - ID do usuário logado para verificação de propriedade da empresa.
   * @returns {Promise<Service>} O serviço criado.
   * @throws {Error} Se a empresa não for encontrada ou o usuário não for o dono.
   */
  async createService(companyId, serviceData, ownerId) {
    const company = await Company.findByPk(companyId);

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

    const service = await Service.create({
      ...serviceData,
      company_id: companyId
    });
    return service.toJSON();
  }

  /**
   * Busca um serviço por ID.
   * @param {string} serviceId - ID do serviço.
   * @returns {Promise<Service|null>} O serviço encontrado ou null.
   */
  async getServiceById(serviceId) {
    const service = await Service.findByPk(serviceId);
    return service ? service.toJSON() : null;
  }

  /**
   * Lista todos os serviços de uma empresa específica.
   * @param {string} companyId - ID da empresa.
   * @returns {Promise<Service[]>} Lista de serviços da empresa.
   * @throws {Error} Se a empresa não for encontrada.
   */
  async getServicesByCompany(companyId) {
    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }
    const services = await Service.findAll({ where: { company_id: companyId } });
    return services.map(service => service.toJSON());
  }

  /**
   * Atualiza um serviço existente.
   * @param {string} companyId - ID da empresa (para verificação).
   * @param {string} serviceId - ID do serviço a ser atualizado.
   * @param {Object} updateData - Dados para atualização.
   * @param {string} ownerId - ID do usuário logado para verificação de propriedade da empresa.
   * @returns {Promise<Service|null>} O serviço atualizado ou null se não encontrado/não autorizado.
   * @throws {Error} Se o serviço ou a empresa não for encontrada, ou o usuário não for o dono.
   */
  async updateService(companyId, serviceId, updateData, ownerId) {
    const service = await Service.findByPk(serviceId);

    if (!service) {
      const error = new Error('Service not found.');
      error.statusCode = 404;
      throw error;
    }
    if (service.company_id !== companyId) {
      const error = new Error('Service does not belong to the specified company.');
      error.statusCode = 400; // Bad request, mismatch between params
      throw error;
    }

    const company = await Company.findByPk(companyId);
    if (!company || company.owner_id !== ownerId) {
      const error = new Error('Unauthorized: You do not own this company or company not found.');
      error.statusCode = 403;
      throw error;
    }

    await service.update(updateData);
    return service.toJSON();
  }

  /**
   * Deleta um serviço.
   * @param {string} companyId - ID da empresa (para verificação).
   * @param {string} serviceId - ID do serviço a ser deletado.
   * @param {string} ownerId - ID do usuário logado para verificação de propriedade da empresa.
   * @returns {Promise<boolean>} True se deletado com sucesso, false caso contrário.
   * @throws {Error} Se o serviço ou a empresa não for encontrada, ou o usuário não for o dono.
   */
  async deleteService(companyId, serviceId, ownerId) {
    const service = await Service.findByPk(serviceId);

    if (!service) {
      const error = new Error('Service not found.');
      error.statusCode = 404;
      throw error;
    }
    if (service.company_id !== companyId) {
      const error = new Error('Service does not belong to the specified company.');
      error.statusCode = 400; // Bad request, mismatch between params
      throw error;
    }

    const company = await Company.findByPk(companyId);
    if (!company || company.owner_id !== ownerId) {
      const error = new Error('Unauthorized: You do not own this company or company not found.');
      error.statusCode = 403;
      throw error;
    }

    await service.destroy();
    return true;
  }
}

module.exports = new ServiceService();