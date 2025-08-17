// services/database.js
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        auth: {
          persistSession: false
        },
        db: {
          schema: 'public'  // Explicitly set to public schema
        }
      }
    );
    this.tableName = process.env.SUPABASE_TABLE || 'scraped_data';
  }

  async testConnection() {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .limit(1);

      if (error) throw error;
      logger.info(`✅ Connected to table: ${this.tableName}`);
      return true;
    } catch (error) {
      logger.error('Database connection failed', {
        error: error.message,
        table: this.tableName,
        supabaseUrl: process.env.SUPABASE_URL
      });
      return false;
    }
  }

  // Add other methods using this.tableName instead of hardcoded table name
  async getUnpostedUpdates(limit = 5) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_posted', false)
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

module.exports = new DatabaseService();