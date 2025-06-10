// src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models'); // Importa todos os seus modelos Sequelize
const User = db.User; // Acessa o modelo User

const JWT_SECRET = process.env.JWT_SECRET; // Sua chave secreta do .env

class AuthService {
  /**
   * Registra um novo usuário.
   * @param {Object} userData - Dados do usuário (name, email, password, role, phone)
   * @returns {Promise<User>} O usuário criado (sem a senha)
   * @throws {Error} Se o e-mail já estiver em uso
   */
  async register(userData) {
    const { name, email, password, role, phone } = userData;

    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds de salt

    // Cria o usuário
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone
    });

    // Retorna o usuário sem a senha
    const userResponse = user.toJSON();
    delete userResponse.password;
    return userResponse;
  }

  /**
   * Autentica um usuário e gera um JWT.
   * @param {string} email - E-mail do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Um objeto com o usuário e o token JWT
   * @throws {Error} Se as credenciais forem inválidas
   */
  async login(email, password) {
    // Busca o usuário pelo e-mail
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Compara a senha fornecida com o hash armazenado
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Gera o JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expira em 1 hora
    );

    // Retorna o usuário sem a senha e o token
    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
  }
}

module.exports = new AuthService(); // Exporta uma instância da classe