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
          *,
          profiles (
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return events || [];
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
  },

  // Get all non-archived events
  async getAllEvents(): Promise<any[]> {
    const { data, error } = await safeQuery('editor/allEvents', async () => {
      const { data: events, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .neq('is_archived', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return events || [];
    });

    if (error) throw error;
    return data as any[];
  },

  // Archive an event
  async archiveEvent(eventId: string): Promise<void> {
    const { error } = await safeQuery('editor/archiveEvent', async () => {
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateError) throw updateError;
      return true;
    });

    if (error) throw error;
  }
};
