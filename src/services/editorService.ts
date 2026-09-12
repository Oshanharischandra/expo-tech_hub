import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';
import { Event } from '../types/payload';

export const editorService = {
  // Get pending events
  async getPendingSubmissions(): Promise<any[]> {
    const { data, error } = await safeQuery('editor/pendingSubmissions', async () => {
      const { data: events, error: fetchError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          event_date,
          venue,
          max_team_size,
          tags,
          status,
          created_at,
          submitter_id
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const submitterIds = events?.map(e => e.submitter_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', submitterIds);

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      return events?.map(event => ({
        ...event,
        submitter: profileMap.get(event.submitter_id) || { name: 'Unknown' }
      })) || [];
    });

    if (error) throw error;
    return data as any[];
  },

  // Approve an event
  async approveEvent(eventId: string): Promise<void> {
    const { error } = await safeQuery('editor/approveEvent', async () => {
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateError) throw updateError;
      return true;
    });

    if (error) throw error;
  },

  // Reject an event
  async rejectEvent(eventId: string, reason?: string): Promise<void> {
    const { error } = await safeQuery('editor/rejectEvent', async () => {
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateError) throw updateError;
      return true;
    });

    if (error) throw error;
  }
};
