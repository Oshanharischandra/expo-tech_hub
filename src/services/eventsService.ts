import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';
import { Event } from '../types/payload';

export const eventsService = {
  async listFeatured(category?: string): Promise<Event[]> {
    const { data, error } = await safeQuery('events/listFeatured', async () => {
      let query = supabase
        .from('events')
        .select(`*`)
        .eq('status', 'approved')
        .neq('is_archived', true);
        
      if (category && category !== 'All Events') {
        query = query.eq('category', category);
      }
        
      const res = await query
        .order('event_date', { ascending: true })
        .limit(12);
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) throw error;
    return (data || []) as Event[];
  },

  async listAll(page = 1, limit = 50, category?: string): Promise<Event[]> {
    const { data, error } = await safeQuery('events/listAll', async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('events')
        .select(`*`)
        .eq('status', 'approved')
        .neq('is_archived', true);
        
      if (category && category !== 'All Events') {
        query = query.eq('category', category);
      }

      const res = await query
        .order('event_date', { ascending: true })
        .range(from, to);
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) throw error;
    return (data || []) as Event[];
  },

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await safeQuery('events/getById', async () => {
      const res = await supabase
        .from('events')
        .select(`*`)
        .eq('id', id)
        .single();
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    return data as Event;
  },

  async listMyEvents(userId: string): Promise<Event[]> {
    const { data, error } = await safeQuery('events/listMyEvents', async () => {
      const res = await supabase
        .from('events')
        .select(`*`)
        .eq('submitter_id', userId)
        .order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) throw error;
    return (data || []) as Event[];
  },

  async submitEvent(event: Partial<Event>, userId: string): Promise<Event> {
    const { data, error } = await safeQuery('events/submitEvent', async () => {
      const eventToSubmit = {
        title: event.title,
        description: event.description || '',
        cover_image: event.cover_image,
        event_date: event.event_date,
        venue: event.venue,
        registration_link: event.registration_link,
        registration_deadline: event.registration_deadline,
        important_dates: event.important_dates || [],
        category: event.category || 'Workshops',
        max_team_size: event.max_team_size,
        tags: event.tags || [],
        status: 'pending',
        submitter_id: userId
      };

      const res = await supabase
        .from('events')
        .insert(eventToSubmit)
        .select('*')
        .single();
      
      if (res.error) throw res.error;
      return res.data;
    });
    
    if (error) throw error;
    return data as Event;
  },

  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    const { data, error } = await safeQuery('events/updateEvent', async () => {
      const eventToUpdate = {
        title: event.title,
        description: event.description,
        cover_image: event.cover_image,
        event_date: event.event_date,
        venue: event.venue,
        registration_link: event.registration_link,
        registration_deadline: event.registration_deadline,
        important_dates: event.important_dates,
        category: event.category,
        max_team_size: event.max_team_size,
        tags: event.tags,
        status: 'pending', // Force pending on update
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(eventToUpdate).forEach(key => 
        (eventToUpdate as any)[key] === undefined && delete (eventToUpdate as any)[key]
      );

      const res = await supabase
        .from('events')
        .update(eventToUpdate)
        .eq('id', id)
        .select('*')
        .single();
        
      if (res.error) throw res.error;
      return res.data;
    });
    
    if (error) throw error;
    return data as Event;
  },
};

export default eventsService;
