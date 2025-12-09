import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';
import axios from 'axios';

export class SupabaseStorageService {
  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'audio-recordings';

    logger.info('Supabase Storage Service initialized', { bucket: this.bucket });
  }

  async uploadAudio(
    file: Buffer,
    userId: string,
    lectureId: string,
    fileName: string
  ): Promise<string> {
    try {
      const filePath = `${userId}/${lectureId}/${fileName}`;

      logger.info('Uploading audio file to Supabase', { filePath, size: file.length });

      const { data, error } = await this.client.storage
        .from(this.bucket)
        .upload(filePath, file, {
          contentType: 'audio/wav',
          upsert: true,
        });

      if (error) {
        logger.error('Supabase upload failed', { error });
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.client.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      logger.info('Audio file uploaded successfully', {
        filePath,
        publicUrl: urlData.publicUrl
      });

      return urlData.publicUrl;
    } catch (error) {
      logger.error('Error uploading audio to Supabase', { userId, lectureId, error });
      throw error;
    }
  }

  async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      logger.info('Downloading audio file from Supabase', { audioUrl });

      // If it's a Supabase URL, extract the path and use SDK
      if (audioUrl.includes('supabase.co')) {
        const url = new URL(audioUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.indexOf('object') + 2; // Skip 'storage', 'v1', 'object', 'public'
        const filePath = pathParts.slice(bucketIndex).join('/');

        const { data, error } = await this.client.storage
          .from(this.bucket)
          .download(filePath);

        if (error) {
          logger.error('Supabase download failed', { error });
          throw error;
        }

        if (!data) {
          throw new Error('No data received from Supabase');
        }

        const buffer = Buffer.from(await data.arrayBuffer());
        logger.info('Audio file downloaded successfully', { size: buffer.length });
        return buffer;
      }

      // Fallback to direct HTTP download for any URL
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);
      logger.info('Audio file downloaded successfully via HTTP', { size: buffer.length });
      return buffer;
    } catch (error) {
      logger.error('Error downloading audio from Supabase', { audioUrl, error });
      throw error;
    }
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    try {
      if (!audioUrl.includes('supabase.co')) {
        logger.warn('Cannot delete non-Supabase URL', { audioUrl });
        return;
      }

      const url = new URL(audioUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('object') + 2;
      const filePath = pathParts.slice(bucketIndex).join('/');

      const { error } = await this.client.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        logger.error('Supabase delete failed', { error });
        throw error;
      }

      logger.info('Audio file deleted successfully', { filePath });
    } catch (error) {
      logger.error('Error deleting audio from Supabase', { audioUrl, error });
      throw error;
    }
  }

  async getSignedUrl(audioUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (!audioUrl.includes('supabase.co')) {
        return audioUrl; // Return as-is if not a Supabase URL
      }

      const url = new URL(audioUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('object') + 2;
      const filePath = pathParts.slice(bucketIndex).join('/');

      const { data, error } = await this.client.storage
        .from(this.bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        logger.error('Failed to create signed URL', { error });
        throw error;
      }

      logger.info('Signed URL created', { expiresIn });
      return data.signedUrl;
    } catch (error) {
      logger.error('Error creating signed URL', { audioUrl, error });
      throw error;
    }
  }

  async listUserAudioFiles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(userId);

      if (error) {
        logger.error('Failed to list audio files', { error });
        throw error;
      }

      const fileUrls = data.map(file => {
        const { data: urlData } = this.client.storage
          .from(this.bucket)
          .getPublicUrl(`${userId}/${file.name}`);
        return urlData.publicUrl;
      });

      logger.info('Listed user audio files', { userId, count: fileUrls.length });
      return fileUrls;
    } catch (error) {
      logger.error('Error listing user audio files', { userId, error });
      throw error;
    }
  }
}

export const supabaseStorage = new SupabaseStorageService();
