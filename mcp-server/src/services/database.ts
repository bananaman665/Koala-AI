import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

export class SupabaseDatabaseService {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    logger.info('Supabase Database Service initialized');
  }

  // Lecture operations
  async getLecture(lectureId: string) {
    try {
      const { data, error } = await this.client
        .from('lectures')
        .select('*')
        .eq('id', lectureId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting lecture', { lectureId, error });
      throw error;
    }
  }

  async updateLecture(lectureId: string, updates: any) {
    try {
      const { data, error } = await this.client
        .from('lectures')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lectureId)
        .select()
        .single();

      if (error) throw error;
      logger.info('Lecture updated', { lectureId });
      return data;
    } catch (error) {
      logger.error('Error updating lecture', { lectureId, error });
      throw error;
    }
  }

  // Transcript operations
  async saveTranscript(
    lectureId: string,
    userId: string,
    content: string
  ) {
    try {
      const { data, error } = await this.client
        .from('transcripts')
        .insert({
          lecture_id: lectureId,
          user_id: userId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Transcript saved', { lectureId, transcriptId: data.id });

      // Update lecture status
      await this.updateLecture(lectureId, {
        transcription_status: 'completed',
      });

      return data.id;
    } catch (error) {
      logger.error('Error saving transcript', { lectureId, error });
      throw error;
    }
  }

  async getTranscript(lectureId: string) {
    try {
      const { data, error } = await this.client
        .from('transcripts')
        .select('*')
        .eq('lecture_id', lectureId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting transcript', { lectureId, error });
      throw error;
    }
  }

  // Notes operations
  async saveNotes(
    lectureId: string,
    userId: string,
    content: any
  ) {
    try {
      const { data, error } = await this.client
        .from('notes')
        .insert({
          lecture_id: lectureId,
          user_id: userId,
          content: JSON.stringify(content),
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Notes saved', { lectureId, notesId: data.id });
      return data.id;
    } catch (error) {
      logger.error('Error saving notes', { lectureId, error });
      throw error;
    }
  }

  async getNotes(lectureId: string) {
    try {
      const { data, error } = await this.client
        .from('notes')
        .select('*')
        .eq('lecture_id', lectureId)
        .single();

      if (error) throw error;

      return {
        ...data,
        content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
      };
    } catch (error) {
      logger.error('Error getting notes', { lectureId, error });
      throw error;
    }
  }

  // Search operations
  async searchTranscripts(
    userId: string,
    query: string,
    filters?: {
      dateFrom?: Date;
      dateTo?: Date;
      courseId?: string;
    }
  ) {
    try {
      let queryBuilder = this.client
        .from('lectures')
        .select(`
          id,
          title,
          created_at,
          transcripts (
            content
          )
        `)
        .eq('user_id', userId);

      if (filters?.dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateTo.toISOString());
      }

      if (filters?.courseId) {
        queryBuilder = queryBuilder.eq('course_id', filters.courseId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Filter by text search and format results
      const results = data
        .filter((lecture: any) => {
          const transcript = lecture.transcripts?.[0];
          return transcript && transcript.content.toLowerCase().includes(query.toLowerCase());
        })
        .map((lecture: any) => {
          const transcript = lecture.transcripts[0];
          const queryIndex = transcript.content.toLowerCase().indexOf(query.toLowerCase());
          const snippetStart = Math.max(0, queryIndex - 100);
          const snippetEnd = Math.min(transcript.content.length, queryIndex + 100);
          const snippet = transcript.content.substring(snippetStart, snippetEnd);

          return {
            lectureId: lecture.id,
            title: lecture.title,
            snippet: `...${snippet}...`,
            relevance: 1.0,
            recordedAt: lecture.created_at,
          };
        });

      logger.info('Search completed', { userId, query, resultsCount: results.length });
      return results;
    } catch (error) {
      logger.error('Error searching transcripts', { userId, query, error });
      throw error;
    }
  }

  // User usage tracking
  async updateUsage(userId: string, minutesUsed: number) {
    try {
      const { error } = await this.client.rpc('increment_monthly_minutes', {
        user_id: userId,
        minutes: minutesUsed,
      });

      if (error) {
        // If RPC doesn't exist, do it manually
        const { data: user } = await this.client
          .from('users')
          .select('monthly_minutes_used')
          .eq('id', userId)
          .single();

        if (user) {
          await this.client
            .from('users')
            .update({
              monthly_minutes_used: (user.monthly_minutes_used || 0) + minutesUsed,
            })
            .eq('id', userId);
        }
      }

      logger.info('Usage updated', { userId, minutesUsed });
    } catch (error) {
      logger.error('Error updating usage', { userId, error });
      throw error;
    }
  }

  // Course operations
  async getCourse(courseId: string) {
    try {
      const { data, error } = await this.client
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting course', { courseId, error });
      throw error;
    }
  }

  async getUserCourses(userId: string) {
    try {
      const { data, error } = await this.client
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting user courses', { userId, error });
      throw error;
    }
  }

  getClient() {
    return this.client;
  }
}

export const supabaseDb = new SupabaseDatabaseService();
