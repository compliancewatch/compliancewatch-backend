// services/supabase.js
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = {
  supabase,
  getUnpostedUpdates: async (limit = 5) => {
    const { data, error } = await supabase
      .from('news_updates')
      .select('*')
      .eq('is_posted', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('Supabase query failed', error);
      throw error;
    }
    return data;
  }
};