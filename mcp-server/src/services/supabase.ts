import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';
import axios from 'axios';

/**
 * Service for managing audio file storage in Supabase Storage.
 * Handles file uploads, downloads, and public URL generation.
 *
 * @example
 * ```typescript
 * const storageService = new SupabaseStorageService();
 * const url = await storageService.uploadAudio(buffer, userId, lectureId, 'recording.wav');
 * const audioData = await storageService.downloadAudio(url);
 * ```
 */
export class SupabaseStorageService {
  private client: SupabaseClient;
  private bucket: string;

  /**
   * Initializes the Supabase Storage service.
   *
   * @throws {Error} If SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are not set
   */
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

  /**
   * Uploads an audio file to Supabase Storage and returns its public URL.
   *
   * Files are stored with the path structure: `{userId}/{lectureId}/{fileName}`
   * If a file already exists at the path, it will be replaced (upsert: true).
   *
   * @param file - Audio file as a Buffer
   * @param userId - UUID of the user who owns the file
   * @param lectureId - UUID of the lecture this audio belongs to
   * @param fileName - Name of the file including extension (e.g., 'recording.wav')
   * @returns Public URL of the uploaded file
   *
   * @throws {Error} If upload fails or Supabase returns an error
   *
   * @example
   * ```typescript
   * const audioBuffer = fs.readFileSync('lecture.wav');
   * const url = await storageService.uploadAudio(
   *   audioBuffer,
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   '123e4567-e89b-12d3-a456-426614174001',
   *   'lecture.wav'
   * );
   * console.log(url); // https://...supabase.co/storage/v1/object/public/audio-recordings/...
   * ```
   */
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

  /**
   * Downloads an audio file from a URL and returns it as a Buffer.
   *
   * Supports both Supabase Storage URLs (using SDK) and generic HTTP URLs (using axios).
   * For Supabase URLs, extracts the file path and uses the storage SDK for authenticated access.
   *
   * @param audioUrl - Full URL of the audio file to download
   * @returns Audio file data as a Buffer
   *
   * @throws {Error} If download fails, file not found, or network error
   *
   * @example
   * ```typescript
   * const url = 'https://...supabase.co/storage/v1/object/public/audio-recordings/...';
   * const audioBuffer = await storageService.downloadAudio(url);
   * console.log(audioBuffer.length); // 1048576
   * ```
   */
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
