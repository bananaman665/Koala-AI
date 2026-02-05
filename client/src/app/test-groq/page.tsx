'use client'

import { useState } from 'react'
import { useAINotes, useAISummary } from '@/hooks/useAI'

export const dynamic = 'force-dynamic'

export default function GroqTestPage() {
  const [transcript, setTranscript] = useState(
    `In today's lecture, we'll cover binary search trees, a fundamental data structure in computer science. 
A binary search tree is a node-based binary tree where each node has at most two children. 
The key property is that for any node, all values in its left subtree are less than the node's value, 
and all values in its right subtree are greater. This property enables efficient searching, insertion, 
and deletion operations with O(log n) average time complexity. We'll also discuss tree traversal methods 
including in-order, pre-order, and post-order traversal.`
  )

  const { notes, isGenerating: generatingNotes, error: notesError, generateNotes } = useAINotes()
  const { summary, isGenerating: generatingSummary, error: summaryError, generateSummary } = useAISummary()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Groq AI Test</h1>
          <p className="text-gray-600 mb-6">
            Test your Groq API integration by generating notes and summaries
          </p>

          {/* Transcript Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Transcript
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Enter a sample transcript..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => generateNotes(transcript)}
              disabled={generatingNotes || !transcript}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {generatingNotes ? 'RefreshCw Generating Notes...' : 'FileText Generate Notes'}
            </button>

            <button
              onClick={() => generateSummary(transcript, 100)}
              disabled={generatingSummary || !transcript}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {generatingSummary ? 'RefreshCw Generating Summary...' : 'File Generate Summary'}
            </button>
          </div>

          {/* Errors */}
          {notesError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">X Notes Error</p>
              <p className="text-red-600 text-sm mt-1">{notesError}</p>
            </div>
          )}

          {summaryError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">X Summary Error</p>
              <p className="text-red-600 text-sm mt-1">{summaryError}</p>
            </div>
          )}

          {/* Results */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Generated Notes */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                FileText Generated Notes
              </h3>
              {notes ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 text-sm font-sans">
                    {notes}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Click "Generate Notes" to see AI-generated notes
                </p>
              )}
            </div>

            {/* Generated Summary */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                File Generated Summary
              </h3>
              {summary ? (
                <p className="text-gray-700 text-sm">{summary}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Click "Generate Summary" to see AI-generated summary
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            AlertTriangle Setup Required
          </h3>
          <p className="text-yellow-800 text-sm mb-3">
            If you see errors, make sure you've set up your Groq API key:
          </p>
          <ol className="list-decimal list-inside text-yellow-800 text-sm space-y-1">
            <li>Get your API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com/keys</a></li>
            <li>Add it to <code className="bg-yellow-100 px-1 rounded">.env.local</code>: <code className="bg-yellow-100 px-1 rounded">GROQ_API_KEY=your_key_here</code></li>
            <li>Restart your dev server</li>
          </ol>
          <p className="text-yellow-800 text-sm mt-3">
            See <code className="bg-yellow-100 px-1 rounded">GROQ_SETUP.md</code> for detailed instructions.
          </p>
        </div>
      </div>
    </div>
  )
}
