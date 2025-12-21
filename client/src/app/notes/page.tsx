'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiDownload, FiShare2, FiEdit2, FiPlay, FiPause, FiClock, FiBookmark } from 'react-icons/fi'

export default function NotesPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState('12:34')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <FiArrowLeft />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <FiShare2 />
                <span>Share</span>
              </button>
              <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <FiDownload />
                <span>Export</span>
              </button>
              <button className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg flex items-center space-x-2">
                <FiEdit2 />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lecture Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Binary Trees & Tree Traversal
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <FiBookmark className="text-blue-600" />
                      <span>CS101 - Data Structures</span>
                    </span>
                    <span>•</span>
                    <span>Prof. Sarah Johnson</span>
                    <span>•</span>
                    <span>Nov 27, 2025</span>
                    <span>•</span>
                    <span>1h 15m</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Completed
                </span>
              </div>

              {/* Audio Player */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
                  >
                    {isPlaying ? (
                      <FiPause className="text-white text-xl" />
                    ) : (
                      <FiPlay className="text-white text-xl ml-1" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{currentTime}</span>
                      <span>1:15:23</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '16%' }}></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-600 hover:text-gray-900">1x</button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🤖</span>
                AI Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">
                This lecture covers the fundamentals of binary trees, a hierarchical data structure where 
                each node has at most two children. Key topics include tree terminology (root, leaf, parent, 
                child), different types of binary trees (full, complete, perfect), and three main traversal 
                methods: in-order, pre-order, and post-order. The professor emphasized the O(log n) time 
                complexity for balanced trees and demonstrated practical applications in file systems and 
                expression parsing.
              </p>
            </div>

            {/* Key Points */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Points</h2>
              <div className="space-y-3">
                {[
                  { time: '00:05:30', point: 'Definition: Binary tree is a hierarchical structure with max 2 children per node' },
                  { time: '00:12:15', point: 'Tree terminology: root, leaf, parent, child, sibling nodes explained' },
                  { time: '00:24:40', point: 'Types of binary trees: Full, Complete, Perfect, and Balanced trees' },
                  { time: '00:38:20', point: 'In-order traversal: Left → Root → Right (produces sorted output for BST)' },
                  { time: '00:45:50', point: 'Pre-order traversal: Root → Left → Right (useful for copying trees)' },
                  { time: '00:52:30', point: 'Post-order traversal: Left → Right → Root (useful for deletion)' },
                  { time: '01:03:15', point: 'Time complexity: O(log n) for balanced trees, O(n) for skewed trees' },
                  { time: '01:10:45', point: 'Applications: File systems, expression trees, Huffman coding' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex-shrink-0 w-20 text-xs text-blue-600 font-medium mt-1">
                      <FiClock className="inline mr-1" />
                      {item.time}
                    </div>
                    <p className="text-gray-700 flex-1">{item.point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Topics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Topics Covered</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Binary Tree Structure
                  </h3>
                  <p className="text-gray-700 ml-4 mb-2">
                    A binary tree is a hierarchical data structure in which each node has at most two children, 
                    referred to as the left child and right child. The topmost node is called the root.
                  </p>
                  <div className="ml-4 space-y-1">
                    <div className="flex items-start space-x-2 text-sm">
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Root: The topmost node with no parent</span>
                    </div>
                    <div className="flex items-start space-x-2 text-sm">
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Leaf: Nodes with no children</span>
                    </div>
                    <div className="flex items-start space-x-2 text-sm">
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Height: Longest path from root to any leaf</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                    Tree Traversal Methods
                  </h3>
                  <p className="text-gray-700 ml-4 mb-3">
                    Three fundamental ways to visit all nodes in a binary tree systematically:
                  </p>
                  <div className="ml-4 space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">In-order (LNR)</div>
                      <div className="text-sm text-gray-600">Visit left subtree → Visit node → Visit right subtree</div>
                      <div className="text-xs text-gray-500 mt-1">Result: Sorted order for Binary Search Trees</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">Pre-order (NLR)</div>
                      <div className="text-sm text-gray-600">Visit node → Visit left subtree → Visit right subtree</div>
                      <div className="text-xs text-gray-500 mt-1">Use case: Creating a copy of the tree</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">Post-order (LRN)</div>
                      <div className="text-sm text-gray-600">Visit left subtree → Visit right subtree → Visit node</div>
                      <div className="text-xs text-gray-500 mt-1">Use case: Deleting the tree</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Time Complexity Analysis
                  </h3>
                  <div className="ml-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Balanced Tree Operations:</span>
                        <code className="px-2 py-1 bg-white rounded text-green-700 font-mono text-sm">O(log n)</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Skewed Tree Operations:</span>
                        <code className="px-2 py-1 bg-white rounded text-red-700 font-mono text-sm">O(n)</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Traversal (all methods):</span>
                        <code className="px-2 py-1 bg-white rounded text-blue-700 font-mono text-sm">O(n)</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vocabulary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Terminology</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { term: 'Node', def: 'A fundamental unit of a tree containing data and links to children' },
                  { term: 'Edge', def: 'Connection between two nodes (parent-child relationship)' },
                  { term: 'Depth', def: 'Number of edges from root to a node' },
                  { term: 'Level', def: 'Set of all nodes at the same depth' },
                  { term: 'Subtree', def: 'A tree formed by a node and all its descendants' },
                  { term: 'Degree', def: 'Number of children a node has' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900 mb-1">{item.term}</div>
                    <div className="text-sm text-gray-600">{item.def}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Assignments & Action Items
              </h2>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-700">Complete Problem Set 5 (due Friday) - Implement three traversal methods</span>
                </li>
                <li className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-700">Read Chapter 6.1-6.3 in textbook about balanced trees</span>
                </li>
                <li className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-700">Practice coding binary tree operations on LeetCode</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lecture Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium text-gray-900">1h 15m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count</span>
                  <span className="font-medium text-gray-900">8,452</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Topics</span>
                  <span className="font-medium text-gray-900">3 major</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Key Points</span>
                  <span className="font-medium text-gray-900">8</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {['Data Structures', 'Trees', 'Algorithms', 'CS101', 'Computer Science'].map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-900">
                  📄 Export as PDF
                </button>
                <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-900">
                  📝 Export as Markdown
                </button>
                <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-900">
                  📋 Copy to Notion
                </button>
                <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-900">
                  📧 Email Notes
                </button>
              </div>
            </div>

            {/* Related Lectures */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Lectures</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="font-medium text-sm text-gray-900">Week 4: Linked Lists</div>
                  <div className="text-xs text-gray-500">45 minutes</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="font-medium text-sm text-gray-900">Week 6: BST Operations</div>
                  <div className="text-xs text-gray-500">1h 20m</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
