import Link from 'next/link'
import { FiMic, FiFileText, FiZap, FiCheck } from 'react-icons/fi'
import AppIcon from '@/components/AppIcon'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 pt-safe-header">
            <div className="flex items-center space-x-2">
              <AppIcon size="lg" />
              <span className="text-2xl font-bold text-gray-900">
                Koala.ai
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
                How it Works
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="bg-accent-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-accent-700 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-12">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Lectures Into
            <span className="block text-accent-600">
              Intelligent Notes
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Record your professor's lectures and let AI transform them into structured,
            searchable notes. Never miss an important concept again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/dashboard"
              className="bg-accent-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent-700 transition-all shadow-lg hover:shadow-xl"
            >
              Start Recording Free
            </Link>
            <button className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Hero Image/Mockup */}
        <div className="mt-20 relative">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gray-100 h-12 flex items-center px-4 space-x-2 border-b border-gray-200">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
            <div className="p-10 grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <FiMic className="text-white text-xl" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Recording</div>
                    <div className="font-semibold">CS101 - Data Structures</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">Live Transcription</div>
                  <div className="text-gray-700 italic">
                    "Today we'll cover binary trees and their applications..."
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-3">Generated Notes</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <FiCheck className="text-green-500 mt-1 flex-shrink-0" />
                    <span>Binary trees are hierarchical data structures</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FiCheck className="text-green-500 mt-1 flex-shrink-0" />
                    <span>Each node has at most two children</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FiCheck className="text-green-500 mt-1 flex-shrink-0" />
                    <span>Time complexity: O(log n) for balanced trees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Ace Your Classes
            </h2>
            <p className="text-xl text-gray-600">
              Powered by AI, designed for students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 hover:shadow-md transition-all border border-gray-100 hover:border-accent-200">
              <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center mb-5">
                <FiMic className="text-accent-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                One-Click Recording
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Record lectures with a single click. Works on any device, even in the background.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 hover:shadow-md transition-all border border-gray-100 hover:border-accent-200">
              <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center mb-5">
                <FiZap className="text-accent-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Transcription
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Whisper AI converts speech to text with industry-leading accuracy.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 hover:shadow-md transition-all border border-gray-100 hover:border-accent-200">
              <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center mb-5">
                <FiFileText className="text-accent-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Notes Generation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get structured notes with key points, summaries, and study guides automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              From recording to notes in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-accent-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent-600/25">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Record</h3>
              <p className="text-gray-600 leading-relaxed">
                Hit record before class starts. We'll capture everything clearly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-accent-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent-600/25">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Transcribe</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI transcribes your lecture with high accuracy in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-accent-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent-600/25">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Study</h3>
              <p className="text-gray-600 leading-relaxed">
                Review AI-generated notes, summaries, and key concepts instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Study Habits?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10">
            Join thousands of students using Koala.ai to ace their classes
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-accent-700 px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AppIcon size="lg" />
                <span className="text-xl font-bold text-white">Koala.ai</span>
              </div>
              <p className="text-sm">
                AI-powered lecture notes for modern students
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © 2025 Koala.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
