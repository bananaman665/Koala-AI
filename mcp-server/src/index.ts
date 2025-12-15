import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { MCPServer } from './mcp/server';
import { groqService } from './services/groq';
import { supabaseDb } from './services/database';
import { supabaseStorage } from './services/supabase';
import logger from './utils/logger';
import {
  transcribeRequestSchema,
  generateNotesRequestSchema,
  searchRequestSchema,
  validateAudioFormat,
  validateFileSize,
} from './utils/validators';
import type {
  ApiResponse,
  TranscribeRequest,
  GenerateNotesRequest,
  SearchRequest,
} from '../../shared/src/types';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_AUDIO_FILE_SIZE || '26214400', 10),
  },
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.MCP_SERVER_VERSION || '0.1.0',
  });
});

// Transcribe audio endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'No audio file provided',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Validate file
    if (!validateAudioFormat(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid audio format. Allowed: MP3, WAV, MP4, M4A, WebM',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    if (!validateFileSize(req.file.size)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds maximum allowed',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const requestData: TranscribeRequest = {
      audioUrl: '', // Will be set after upload
      language: req.body.language,
      lectureId: req.body.lectureId,
      userId: req.body.userId,
    };

    const validated = transcribeRequestSchema.parse(requestData);

    // Upload to Supabase Storage
    const audioUrl = await supabaseStorage.uploadAudio(
      req.file.buffer,
      validated.userId,
      validated.lectureId,
      req.file.originalname
    );

    // Update lecture with audio URL
    await supabaseDb.updateLecture(validated.lectureId, {
      audio_url: audioUrl,
      transcription_status: 'pending',
    });

    // Transcribe audio
    const audioBuffer = req.file.buffer;
    const transcriptionResult = await groqService.transcribeAudio(
      audioBuffer,
      validated.language
    );

    // Save transcript
    const segments = (transcriptionResult.segments || []).map((seg: any, index: number) => ({
      id: `seg-${index}`,
      text: seg.text,
      start: seg.start,
      end: seg.end,
      confidence: seg.confidence,
    }));

    const transcriptId = await supabaseDb.saveTranscript(
      validated.lectureId,
      validated.userId,
      JSON.stringify({ text: transcriptionResult.text, segments, language: transcriptionResult.language })
    );

    // Update usage
    const durationMinutes = Math.ceil(transcriptionResult.duration / 60);
    await supabaseDb.updateUsage(validated.userId, durationMinutes);

    res.json({
      success: true,
      data: {
        lectureId: validated.lectureId,
        transcriptId,
        audioUrl,
        text: transcriptionResult.text,
        segments,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);

    logger.info('Transcription completed', {
      lectureId: validated.lectureId,
      transcriptId,
    });
  } catch (error) {
    logger.error('Transcription failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSCRIPTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Generate notes endpoint
app.post('/api/generate-notes', async (req, res) => {
  try {
    const requestData: GenerateNotesRequest = req.body;
    const validated = generateNotesRequestSchema.parse(requestData);

    const startTime = Date.now();

    // Generate notes using Groq
    const notesJson = await groqService.generateNotes(
      validated.transcript,
      validated.options
    );

    const processingTime = Date.now() - startTime;
    const parsedNotes = JSON.parse(notesJson);

    // Save notes
    const notesId = await supabaseDb.saveNotes(
      validated.lectureId,
      validated.userId,
      {
        ...parsedNotes,
        metadata: {
          style: validated.options?.style || 'detailed',
          includeTimestamps: validated.options?.includeTimestamps || false,
          generatedBy: `groq/${process.env.GROQ_MODEL || 'llama-3.1-70b-versatile'}`,
          processingTime,
        },
      }
    );

    const notes = await supabaseDb.getNotes(validated.lectureId);

    res.json({
      success: true,
      data: {
        lectureId: validated.lectureId,
        notesId,
        notes,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);

    logger.info('Notes generated', { lectureId: validated.lectureId, notesId });
  } catch (error) {
    logger.error('Notes generation failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTES_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Get lecture info endpoint
app.get('/api/lectures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lecture = await supabaseDb.getLecture(id);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LECTURE_NOT_FOUND',
          message: `Lecture not found: ${id}`,
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    let transcript = null;
    let notes = null;

    try {
      transcript = await supabaseDb.getTranscript(id);
    } catch (error) {
      // Transcript might not exist
    }

    try {
      notes = await supabaseDb.getNotes(id);
    } catch (error) {
      // Notes might not exist
    }

    res.json({
      success: true,
      data: {
        lecture,
        transcript,
        notes,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get lecture', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LECTURE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Search transcripts endpoint
app.post('/api/search', async (req, res) => {
  try {
    const requestData: SearchRequest = req.body;
    const validated = searchRequestSchema.parse(requestData);

    const results = await supabaseDb.searchTranscripts(
      validated.userId,
      validated.query,
      validated.filters
    );

    res.json({
      success: true,
      data: {
        query: validated.query,
        results,
        count: results.length,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Search failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// ============================================
// CLASS MANAGEMENT ROUTES
// ============================================

// Get user's classes (owned and enrolled)
app.get('/api/classes', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      });
    }

    // Get classes owned by user
    const { data: ownedClasses, error: ownedError } = await supabaseDb.getClient()
      .from('classes')
      .select('*, class_memberships(user_id, role)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    // Get classes user is a member of
    const { data: memberClasses, error: memberError } = await supabaseDb.getClient()
      .from('class_memberships')
      .select('classes(*, class_memberships(user_id, role))')
      .eq('user_id', userId);

    // If tables don't exist yet, return empty array
    if (ownedError?.code === 'PGRST205' || memberError?.code === 'PGRST205') {
      return res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
    if (ownedError) throw ownedError;
    if (memberError) throw memberError;

    // Combine and deduplicate
    const memberClassData = (memberClasses?.map(m => m.classes).filter(Boolean) || []) as any[];
    const allClasses = [...(ownedClasses || [])] as any[];
    const ownedIds = new Set(allClasses.map(c => c.id));
    for (const c of memberClassData) {
      if (c && !ownedIds.has(c.id)) {
        allClasses.push(c);
      }
    }
    const data = allClasses;
    const error = null;

    if (error) throw error;

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to fetch classes', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CLASSES_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Create a new class
app.post('/api/classes', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      });
    }

    const { name, code, professor, description, color } = req.body;

    const { data, error } = await supabaseDb.getClient()
      .from('classes')
      .insert({
        owner_id: userId,
        name,
        code,
        professor,
        description: description || '',
        color: color || 'blue',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to create class', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CLASS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Search for a class by code
app.get('/api/classes/search', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Class code is required' },
      } as ApiResponse);
    }

    const { data, error } = await supabaseDb.getClient()
      .from('classes')
      .select('*')
      .ilike('code', code.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return res.status(404).json({
          success: false,
          error: { code: 'CLASS_NOT_FOUND', message: 'Class not found with that code' },
        } as ApiResponse);
      }
      throw error;
    }

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to search class', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_CLASS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Join a class
app.post('/api/classes/:classId/join', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      });
    }

    const { classId } = req.params;

    const { data, error } = await supabaseDb.getClient()
      .from('class_memberships')
      .insert({
        class_id: classId,
        user_id: userId,
        role: 'student',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: { code: 'ALREADY_MEMBER', message: 'Already a member of this class' },
        } as ApiResponse);
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to join class', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'JOIN_CLASS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Leave a class
app.delete('/api/classes/:classId/leave', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      });
    }

    const { classId } = req.params;

    const { error } = await supabaseDb.getClient()
      .from('class_memberships')
      .delete()
      .eq('class_id', classId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      data: { message: 'Left class successfully' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to leave class', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'LEAVE_CLASS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Get class lectures
app.get('/api/classes/:classId/lectures', async (req, res) => {
  try {
    const { classId } = req.params;

    const { data, error } = await supabaseDb.getClient()
      .from('lectures')
      .select('*, courses(name, code, color), transcripts(id), notes(id)')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to fetch class lectures', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_LECTURES_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Add member to class (owner only)
app.post('/api/classes/:classId/members', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      });
    }

    const { classId } = req.params;
    const { memberId, role } = req.body;

    // Check if user is class owner
    const { data: classData, error: classError } = await supabaseDb.getClient()
      .from('classes')
      .select('owner_id')
      .eq('id', classId)
      .single();

    if (classError || classData.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only class owner can add members' },
      } as ApiResponse);
    }

    const { data, error } = await supabaseDb.getClient()
      .from('class_memberships')
      .insert({
        class_id: classId,
        user_id: memberId,
        role: role || 'student',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: { code: 'ALREADY_MEMBER', message: 'User is already a member of this class' },
        } as ApiResponse);
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to add member to class', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_MEMBER_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Remove member from class (owner only)
app.delete('/api/classes/:classId/members/:memberId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      });
    }

    const { classId, memberId } = req.params;

    // Check if user is class owner
    const { data: classData, error: classError } = await supabaseDb.getClient()
      .from('classes')
      .select('owner_id')
      .eq('id', classId)
      .single();

    if (classError || classData.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only class owner can remove members' },
      } as ApiResponse);
    }

    const { error } = await supabaseDb.getClient()
      .from('class_memberships')
      .delete()
      .eq('class_id', classId)
      .eq('user_id', memberId);

    if (error) throw error;

    res.json({
      success: true,
      data: { message: 'Member removed successfully' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to remove member from class', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_MEMBER_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Start Express server
const server = app.listen(PORT, () => {
  logger.info(`Express server listening on ${HOST}:${PORT}`);
});

// Start MCP server (if in MCP mode)
if (process.env.MCP_MODE === 'true') {
  const mcpServer = new MCPServer();
  mcpServer.start().catch((error) => {
    logger.error('Failed to start MCP server', { error });
    process.exit(1);
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await mcpServer.stop();
    server.close();
    process.exit(0);
  });
} else {
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    server.close();
    process.exit(0);
  });
}
