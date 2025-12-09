import { groqService } from '../services/groq';
import { supabaseDb } from '../services/database';
import { supabaseStorage } from '../services/supabase';
import logger from '../utils/logger';
import {
  transcribeRequestSchema,
  generateNotesRequestSchema,
  searchRequestSchema,
} from '../utils/validators';
import type {
  TranscribeRequest,
  TranscribeResponse,
  GenerateNotesRequest,
  GenerateNotesResponse,
  SearchRequest,
  TranscriptSegment,
} from '../../../shared/src/types';

export const tools = [
  {
    name: 'transcribe_audio',
    description: 'Transcribes audio files using Groq Whisper API',
    inputSchema: {
      type: 'object',
      properties: {
        audioUrl: {
          type: 'string',
          description: 'Supabase Storage URL of the audio file',
        },
        language: {
          type: 'string',
          description: 'Language code (e.g., "en", "es"). Optional - auto-detected if not provided',
        },
        lectureId: {
          type: 'string',
          description: 'ID of the lecture document',
        },
        userId: {
          type: 'string',
          description: 'ID of the user who owns this lecture',
        },
      },
      required: ['audioUrl', 'lectureId', 'userId'],
    },
  },
  {
    name: 'generate_notes',
    description: 'Generates structured notes from transcript using Groq Llama 3.1',
    inputSchema: {
      type: 'object',
      properties: {
        transcript: {
          type: 'string',
          description: 'The full transcript text',
        },
        lectureId: {
          type: 'string',
          description: 'ID of the lecture document',
        },
        userId: {
          type: 'string',
          description: 'ID of the user who owns this lecture',
        },
        options: {
          type: 'object',
          properties: {
            style: {
              type: 'string',
              enum: ['detailed', 'concise', 'bullet'],
              description: 'Note-taking style',
            },
            includeTimestamps: {
              type: 'boolean',
              description: 'Whether to include timestamps in notes',
            },
            topics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific topics to focus on',
            },
          },
        },
      },
      required: ['transcript', 'lectureId', 'userId'],
    },
  },
  {
    name: 'get_lecture_info',
    description: 'Retrieves lecture information including transcript and notes',
    inputSchema: {
      type: 'object',
      properties: {
        lectureId: {
          type: 'string',
          description: 'ID of the lecture document',
        },
      },
      required: ['lectureId'],
    },
  },
  {
    name: 'search_transcripts',
    description: 'Searches across all user transcripts',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        userId: {
          type: 'string',
          description: 'ID of the user',
        },
        filters: {
          type: 'object',
          properties: {
            dateFrom: {
              type: 'string',
              format: 'date-time',
              description: 'Filter lectures from this date',
            },
            dateTo: {
              type: 'string',
              format: 'date-time',
              description: 'Filter lectures until this date',
            },
            courseCode: {
              type: 'string',
              description: 'Filter by course code',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags',
            },
          },
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
        },
      },
      required: ['query', 'userId'],
    },
  },
];

export async function handleToolCall(name: string, args: any): Promise<any> {
  logger.info('Tool call received', { name, args });

  try {
    switch (name) {
      case 'transcribe_audio':
        return await handleTranscribeAudio(args);
      case 'generate_notes':
        return await handleGenerateNotes(args);
      case 'get_lecture_info':
        return await handleGetLectureInfo(args);
      case 'search_transcripts':
        return await handleSearchTranscripts(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error('Tool call failed', { name, error });
    throw error;
  }
}

async function handleTranscribeAudio(args: TranscribeRequest): Promise<TranscribeResponse> {
  const validated = transcribeRequestSchema.parse(args);
  const { audioUrl, language, lectureId, userId } = validated;

  // Update lecture status
  await supabaseDb.updateLecture(lectureId, { transcription_status: 'processing' });

  // Download audio file from Supabase Storage
  const audioBuffer = await supabaseStorage.downloadAudio(audioUrl);

  // Transcribe using Groq Whisper
  const result = await groqService.transcribeAudio(audioBuffer, language);

  // Convert Groq segments to our format
  const segments: TranscriptSegment[] = (result.segments || []).map((seg: any, index: number) => ({
    id: `seg-${index}`,
    text: seg.text,
    start: seg.start,
    end: seg.end,
    confidence: seg.confidence,
  }));

  // Save transcript to Supabase
  const transcriptId = await supabaseDb.saveTranscript(
    lectureId,
    userId,
    JSON.stringify({ text: result.text, segments, language: result.language })
  );

  // Update usage
  const durationMinutes = Math.ceil(result.duration / 60);
  await supabaseDb.updateUsage(userId, durationMinutes);

  return {
    lectureId,
    transcriptId,
    text: result.text,
    segments,
    language: result.language,
    duration: result.duration,
  };
}

async function handleGenerateNotes(args: GenerateNotesRequest): Promise<GenerateNotesResponse> {
  const validated = generateNotesRequestSchema.parse(args);
  const { transcript, lectureId, userId, options = {} } = validated;

  const startTime = Date.now();

  // Generate notes using Groq Llama
  const notesJson = await groqService.generateNotes(transcript, options);

  const processingTime = Date.now() - startTime;

  // Parse the JSON response
  const parsedNotes = JSON.parse(notesJson);

  // Save notes to Supabase
  const notesId = await supabaseDb.saveNotes(lectureId, userId, {
    ...parsedNotes,
    metadata: {
      style: options.style || 'detailed',
      includeTimestamps: options.includeTimestamps || false,
      generatedBy: `groq/${process.env.GROQ_MODEL || 'llama-3.1-70b-versatile'}`,
      processingTime,
    },
  });

  const notes = await supabaseDb.getNotes(lectureId);

  if (!notes) {
    throw new Error('Failed to retrieve saved notes');
  }

  return {
    lectureId,
    notesId,
    notes,
  };
}

async function handleGetLectureInfo(args: { lectureId: string }): Promise<any> {
  const { lectureId } = args;

  const lecture = await supabaseDb.getLecture(lectureId);

  if (!lecture) {
    throw new Error(`Lecture not found: ${lectureId}`);
  }

  let transcript = null;
  let notes = null;

  // Get transcript if it exists
  try {
    transcript = await supabaseDb.getTranscript(lectureId);
  } catch (error) {
    // Transcript might not exist yet
    logger.debug('No transcript found for lecture', { lectureId });
  }

  // Get notes if they exist
  try {
    notes = await supabaseDb.getNotes(lectureId);
  } catch (error) {
    // Notes might not exist yet
    logger.debug('No notes found for lecture', { lectureId });
  }

  return {
    lecture,
    transcript,
    notes,
  };
}

async function handleSearchTranscripts(args: SearchRequest): Promise<any> {
  const validated = searchRequestSchema.parse(args);
  const { query, userId, filters } = validated;

  const results = await supabaseDb.searchTranscripts(userId, query, filters);

  return {
    query,
    results,
    count: results.length,
  };
}
