// src/schemas/companyEmployeeSchemas.js

// Schema para convidar um funcionário (recebe o email do usuário a ser convidado)
const inviteEmployeeSchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', description: 'Email of the user to invite as an employee.' }
  },
  additionalProperties: false
};

// Schema para o funcionário aceitar um convite
const acceptInviteSchema = {
  type: 'object',
  required: ['companyId'],
  properties: {
    companyId: { type: 'string', format: 'uuid', description: 'ID of the company for which to accept the invite.' }
  },
  additionalProperties: false
};

// Schema para a resposta de um CompanyEmployee
const companyEmployeeResponseSchema = {
  type: 'object',
  properties: {
    company_id: { type: 'string', format: 'uuid' },
    employee_id: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    employee: { // Inclui detalhes do funcionário (User)
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['admin', 'employee', 'client'] },
        phone: { type: 'string', nullable: true }
      }
    }
  },
  required: ['company_id', 'employee_id', 'status', 'createdAt', 'updatedAt']
};

const companyEmployeeListResponseSchema = {
  type: 'array',
  items: companyEmployeeResponseSchema
};

// Schema para o parâmetro companyId em rotas (já usado antes, mas bom ter aqui tbm)
const companyIdParamSchema = {
  type: 'object',
  properties: {
    companyId: { type: 'string', format: 'uuid' }
  },
  required: ['companyId']
};

// Schema para o parâmetro employeeId (para gerenciar um funcionário específico)
const employeeIdParamSchema = {
  type: 'object',
  properties: {
    employeeId: { type: 'string', format: 'uuid' }
  },
  required: ['employeeId']
};

module.exports = {
  inviteEmployeeSchema,
  acceptInviteSchema,
  companyEmployeeResponseSchema,
  companyEmployeeListResponseSchema,
  companyIdParamSchema,
  employeeIdParamSchema
};