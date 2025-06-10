// src/services/companyService.js
const db = require('../models');
const Company = db.Company;

class CompanyService {
  /**
   * Cria uma nova empresa.
   * @param {Object} companyData - Dados da empresa (name, description, etc.)
   * @param {string} ownerId - ID do usuário que será o dono da empresa.
   * @returns {Promise<Company>} A empresa criada.
   */
  async createCompany(companyData, ownerId) {
    const company = await Company.create({
      ...companyData,
      owner_id: ownerId
    });
    return company.toJSON(); // Retorna o objeto JSON puro
  }

  /**
   * Busca uma empresa por ID.
   * @param {string} companyId - ID da empresa.
   * @returns {Promise<Company|null>} A empresa encontrada ou null.
   */
  async getCompanyById(companyId) {
    const company = await Company.findByPk(companyId);
    return company ? company.toJSON() : null;
  }

  /**
   * Lista todas as empresas (ou as empresas de um owner, etc. - flexível).
   * Por enquanto, lista todas. Pode ser filtrado posteriormente.
   * @returns {Promise<Company[]>} Lista de empresas.
   */
  async getAllCompanies() {
    const companies = await Company.findAll();
    return companies.map(company => company.toJSON());
  }

  /**
   * Atualiza os dados de uma empresa.
   * @param {string} companyId - ID da empresa a ser atualizada.
   * @param {Object} updateData - Dados para atualização.
   * @param {string} ownerId - ID do dono da empresa para verificação de propriedade.
   * @returns {Promise<Company|null>} A empresa atualizada ou null se não encontrada/não autorizada.
   * @throws {Error} Se a empresa não for encontrada ou o usuário não for o dono.
   */
  async updateCompany(companyId, updateData, ownerId) {
    const company = await Company.findByPk(companyId);

    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }

    // Garante que apenas o dono pode atualizar a empresa
    if (company.owner_id !== ownerId) {
      const error = new Error('Unauthorized: You do not own this company.');
      error.statusCode = 403;
      throw error;
    }

    await company.update(updateData);
    return company.toJSON();
  }

  /**
   * Deleta uma empresa.
   * @param {string} companyId - ID da empresa a ser deletada.
   * @param {string} ownerId - ID do dono da empresa para verificação de propriedade.
   * @returns {Promise<boolean>} True se deletado com sucesso, false caso contrário.
   * @throws {Error} Se a empresa não for encontrada ou o usuário não for o dono.
   */
  async deleteCompany(companyId, ownerId) {
    const company = await Company.findByPk(companyId);

    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }

    // Garante que apenas o dono pode deletar a empresa
    if (company.owner_id !== ownerId) {
      const error = new Error('Unauthorized: You do not own this company.');
      error.statusCode = 403;
      throw error;
    }

    await company.destroy();
    return true;
  }
}

module.exports = new CompanyService();