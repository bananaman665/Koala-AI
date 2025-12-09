# Groq AI Setup for Koala.ai

## Overview
Koala.ai uses Groq for ultra-fast AI inference to generate lecture notes, summaries, and answer questions about your recordings.

## Setup

### 1. Get Your Groq API Key
1. Visit [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy your API key

### 2. Add API Key to Environment
Add your Groq API key to `.env.local`:

```bash
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 3. Restart Your Dev Server
```bash
npm run dev
```

## Available Features

### 1. Generate Notes from Transcript
Automatically convert lecture transcripts into structured study notes.

```typescript
import { useAINotes } from '@/hooks/useAI'

function MyComponent() {
  const { notes, isGenerating, error, generateNotes } = useAINotes()
  
  const handleGenerate = async () => {
    await generateNotes(transcriptText)
  }
  
  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Notes'}
      </button>
      {notes && <div>{notes}</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

### 2. Generate Summary
Create concise summaries of lecture content.

```typescript
import { useAISummary } from '@/hooks/useAI'

function MyComponent() {
  const { summary, isGenerating, generateSummary } = useAISummary()
  
  const handleSummary = async () => {
    await generateSummary(notesContent, 150) // 150 word summary
  }
  
  return (
    <button onClick={handleSummary}>Generate Summary</button>
  )
}
```

## API Routes

### Generate Notes
**Endpoint:** `POST /api/ai/generate-notes`

**Request:**
```json
{
  "transcript": "Your lecture transcript here...",
  "options": {
    "model": "llama-3.1-70b-versatile",
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

**Response:**
```json
{
  "success": true,
  "notes": "# Lecture Notes\n\n## Main Topic...",
  "generatedAt": "2025-12-01T12:00:00Z"
}
```

### Generate Summary
**Endpoint:** `POST /api/ai/generate-summary`

**Request:**
```json
{
  "content": "Your content to summarize...",
  "maxWords": 150
}
```

**Response:**
```json
{
  "success": true,
  "summary": "Brief summary of the content...",
  "generatedAt": "2025-12-01T12:00:00Z"
}
```

## Available Models

Groq provides several high-performance models:

- **llama-3.1-70b-versatile** (Default) - Most capable, great for complex tasks
- **llama-3.1-8b-instant** - Fastest, ideal for summaries and quick tasks
- **mixtral-8x7b-32768** - Large context window
- **gemma-7b-it** - Good balance of speed and quality

## Direct Usage (Server-Side Only)

For custom implementations, you can use the Groq utilities directly:

```typescript
import { generateNotesFromTranscript, generateSummary, extractKeyPoints } from '@/lib/groq'

// Generate notes
const notes = await generateNotesFromTranscript(transcript)

// Generate summary
const summary = await generateSummary(content, { maxWords: 200 })

// Extract key points
const keyPoints = await extractKeyPoints(content, 5)
```

## Best Practices

1. **Keep API Key Secret**: Never expose `GROQ_API_KEY` in client-side code
2. **Use Appropriate Models**: Use faster models (8b) for simple tasks, larger models (70b) for complex analysis
3. **Error Handling**: Always handle errors gracefully with try-catch blocks
4. **Rate Limiting**: Groq has rate limits; implement retry logic if needed
5. **Cost Optimization**: Use the fastest model that meets your needs

## Troubleshooting

### API Key Not Working
- Check that the key is correctly set in `.env.local`
- Restart your dev server after adding the key
- Verify the key is valid at console.groq.com

### Slow Response Times
- Try using a faster model like `llama-3.1-8b-instant`
- Reduce `max_tokens` if appropriate
- Check your internet connection

### Rate Limit Errors
- Groq free tier has limits on requests per minute
- Implement exponential backoff retry logic
- Consider upgrading to paid tier for higher limits

## Performance Tips

- **Streaming**: Use streaming for real-time responses (see `streamChatCompletion`)
- **Caching**: Cache generated notes in your database to avoid regenerating
- **Batch Processing**: Process multiple transcripts efficiently
- **Model Selection**: Use 8b models for simple tasks, 70b for complex analysis

## Next Steps

1. Add your Groq API key to `.env.local`
2. Test the API routes using the dashboard
3. Implement note generation in your lecture recording flow
4. Add streaming for real-time note generation experience

For more information, visit [Groq Documentation](https://console.groq.com/docs)
