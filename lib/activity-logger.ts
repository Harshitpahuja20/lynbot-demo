import { getSupabaseAdminClient } from './supabase';

export const activityLogger = {
  async log(params: {
    userId: string;
    activityType: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    description: string;
    metadata?: any;
  }) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase.from('activity_logs').insert({
        user_id: params.userId,
        activity_type: params.activityType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        description: params.description,
        metadata: params.metadata || {}
      });
      
      if (error) {
        console.error('Activity log error:', error);
        console.error('Activity log params:', params);
      } else {
        console.log('Activity logged:', params.description);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  async getRecent(userId: string, limit: number = 10) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};
