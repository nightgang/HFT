const { query } = require('../db/connection');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class UserModel {
  // Create a new user
  static async create(userData) {
    const {
      username,
      email,
      password,
      role = 'trader',
      firstName,
      lastName,
      phone,
      avatarUrl,
      preferences
    } = userData;

    const passwordHash = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, username, email, role, created_at
    `;

    const values = [username, email, passwordHash, role];

    try {
      const result = await query(sql, values);
      const user = result.rows[0];

      // Create profile if additional data provided
      if (firstName || lastName || phone || avatarUrl || preferences) {
        await this.createProfile(user.user_id, {
          firstName,
          lastName,
          phone,
          avatarUrl,
          preferences
        });
      }

      logger.info(`User created: ${user.username}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Create user profile
  static async createProfile(userId, profileData) {
    const { firstName, lastName, phone, avatarUrl, preferences } = profileData;

    const sql = `
      INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url, preferences)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [userId, firstName, lastName, phone, avatarUrl, preferences];

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Find user by username or email
  static async findByUsernameOrEmail(identifier) {
    const sql = `
      SELECT u.*, up.first_name, up.last_name, up.phone, up.avatar_url, up.preferences
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE u.username = $1 OR u.email = $1
    `;

    try {
      const result = await query(sql, [identifier]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding user:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(userId) {
    const sql = `
      SELECT u.*, up.first_name, up.last_name, up.phone, up.avatar_url, up.preferences
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE u.user_id = $1
    `;

    try {
      const result = await query(sql, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId, profileData) {
    const { firstName, lastName, phone, avatarUrl, preferences } = profileData;

    const sql = `
      UPDATE user_profiles
      SET first_name = $1, last_name = $2, phone = $3, avatar_url = $4, preferences = $5, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $6
      RETURNING *
    `;

    const values = [firstName, lastName, phone, avatarUrl, preferences, userId];

    try {
      const result = await query(sql, values);
      if (result.rows.length === 0) {
        // Profile doesn't exist, create it
        return await this.createProfile(userId, profileData);
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Create session
  static async createSession(userId, tokenHash, expiresAt) {
    const sql = `
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [userId, tokenHash, expiresAt];

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  // Find session by token hash
  static async findSessionByToken(tokenHash) {
    const sql = `
      SELECT us.*, u.username, u.email, u.role
      FROM user_sessions us
      JOIN users u ON us.user_id = u.user_id
      WHERE us.token_hash = $1 AND us.expires_at > CURRENT_TIMESTAMP
    `;

    try {
      const result = await query(sql, [tokenHash]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding session:', error);
      throw error;
    }
  }

  // Delete expired sessions
  static async deleteExpiredSessions() {
    const sql = `DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP`;

    try {
      const result = await query(sql);
      logger.info(`Deleted ${result.rowCount} expired sessions`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting expired sessions:', error);
      throw error;
    }
  }
}

module.exports = UserModel;