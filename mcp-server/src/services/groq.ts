import Groq from 'groq-sdk';
import logger from '../utils/logger';

/**
 * Service for interacting with Groq AI APIs.
 * Handles audio transcription using Whisper and text generation using Llama models.
 *
 * @example
 * ```typescript
 * const groqService = new GroqService();
 * const result = await groqService.transcribeAudio(audioBuffer, 'en');
 * const notes = await groqService.generateNotes(result.text);
 * ```
 */
export class GroqService {
  private client: Groq;
  private model: string;
  private whisperModel: string;

  /**
   * Initializes the Groq service with API credentials.
   *
   * @throws {Error} If GROQ_API_KEY environment variable is not set
   */
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({ apiKey });
    this.model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    this.whisperModel = process.env.WHISPER_MODEL || 'whisper-large-v3';

    logger.info('GroqService initialized', {
      model: this.model,
      whisperModel: this.whisperModel
    });
  }

  /**
   * Transcribes audio file to text using Groq's Whisper model.
   *
   * @param audioFile - Audio file as Buffer or File object
   * @param language - ISO language code (e.g., 'en', 'es', 'fr'). If omitted, language is auto-detected
   * @param mimeType - MIME type of audio file (e.g., 'audio/wav', 'audio/mp3'). Defaults to 'audio/wav'
   * @returns Transcription result with text, language, duration, and optional segments
   *
   * @throws {Error} If transcription fails or API returns an error
   *
   * @example
   * ```typescript
   * const audioBuffer = fs.readFileSync('lecture.mp3');
   * const result = await groqService.transcribeAudio(audioBuffer, 'en', 'audio/mp3');
   * console.log(result.text); // "Today we will discuss..."
   * ```
   */
  async transcribeAudio(audioFile: Buffer | File, language?: string, mimeType?: string): Promise<{
    text: string;
    language: string;
    duration: number;
    segments?: any[];
  }> {
    try {
      logger.info('Starting audio transcription', { language, mimeType });

      const startTime = Date.now();

      // Convert Buffer to File if needed
      let fileToUpload: File;
      if (Buffer.isBuffer(audioFile)) {
        const fileMime = mimeType || 'audio/wav';
        const fileExt = this.getFileExtension(fileMime);
        const blob = new Blob([audioFile], { type: fileMime });
        fileToUpload = new File([blob], `audio.${fileExt}`, { type: fileMime });
      } else {
        fileToUpload = audioFile;
      }

      const transcription = await this.client.audio.transcriptions.create({
        file: fileToUpload,
        model: this.whisperModel,
        language: language,
        response_format: 'verbose_json' as any,
      }) as any;

      const duration = (Date.now() - startTime) / 1000;

      logger.info('Audio transcription completed', {
        duration: `${duration}s`,
        textLength: transcription.text?.length || 0
      });

      return {
        text: transcription.text || '',
        language: transcription.language || language || 'en',
        duration,
        segments: transcription.segments || [],
      };
    } catch (error) {
      logger.error('Audio transcription failed', { error });
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates structured study notes from a lecture transcript using Groq's Llama model.
   *
   * @param transcript - Full text of the lecture transcript
   * @param options - Note generation options
   * @param options.style - Note style: 'detailed', 'concise', or 'bullet' (default: 'detailed')
   * @param options.includeTimestamps - Whether to include timestamps in notes
   * @param options.topics - Optional array of specific topics to focus on
   * @returns JSON string containing structured notes with title, summary, key points, topics, vocabulary, assignments, and questions
   *
   * @throws {Error} If note generation fails or API returns an error
   *
   * @example
   * ```typescript
   * const notes = await groqService.generateNotes(transcript, {
   *   style: 'detailed',
   *   topics: ['quantum mechanics', 'wave functions']
   * });
   * const parsed = JSON.parse(notes);
   * console.log(parsed.title); // "Introduction to Quantum Mechanics"
   * ```
   */
  async generateNotes(
    transcript: string,
    options: {
      style?: 'detailed' | 'concise' | 'bullet';
      includeTimestamps?: boolean;
      topics?: string[];
    } = {}
  ): Promise<string> {
    try {
      const { style = 'detailed', topics = [] } = options;

      logger.info('Generating notes from transcript', {
        style,
        transcriptLength: transcript.length,
        topicsCount: topics.length
      });

      const systemPrompt = `You are an expert note-taking assistant. Generate comprehensive, well-structured study notes from lecture transcripts.

Your notes should include:
1. A clear title and summary
2. Key points and main concepts
3. Important topics with detailed explanations
4. Vocabulary terms with definitions
5. Any assignments or action items mentioned
6. Discussion questions or points for further study

Format the notes as a JSON object with this structure:
{
  "title": "Lecture title",
  "summary": "Brief summary of the lecture",
  "keyPoints": ["point 1", "point 2", ...],
  "topics": [
    {
      "name": "Topic name",
      "explanation": "Detailed explanation",
      "importance": "high|medium|low",
      "subtopics": ["subtopic 1", "subtopic 2", ...]
    }
  ],
  "vocabulary": [
    {
      "term": "Term",
      "definition": "Definition",
      "context": "How it was used in the lecture"
    }
  ],
  "assignments": ["assignment 1", "assignment 2", ...],
  "questions": ["question 1", "question 2", ...]
}`;

      const userPrompt = `Generate ${style} notes from this lecture transcript${topics.length > 0 ? `, focusing on these topics: ${topics.join(', ')}` : ''}:\n\n${transcript}`;

      const startTime = Date.now();

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const processingTime = Date.now() - startTime;

      const notesContent = completion.choices[0]?.message?.content || '{}';

      logger.info('Notes generation completed', {
        processingTime: `${processingTime}ms`,
        tokensUsed: completion.usage?.total_tokens
      });

      return notesContent;
    } catch (error) {
      logger.error('Notes generation failed', { error });
      throw new Error(`Notes generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a text completion using Groq's Llama model.
   * General-purpose method for any AI text generation task.
   *
   * @param prompt - The user prompt to send to the AI
   * @param systemPrompt - Optional system prompt to guide AI behavior
   * @returns Generated text completion
   *
   * @throws {Error} If completion generation fails or API returns an error
   *
   * @example
   * ```typescript
   * const summary = await groqService.generateCompletion(
   *   'Summarize the key concepts from this lecture',
   *   'You are a helpful teaching assistant'
   * );
   * console.log(summary);
   * ```
   */
  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: any[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Completion generation failed', { error });
      throw new Error(`Completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const groqService = new GroqService();
