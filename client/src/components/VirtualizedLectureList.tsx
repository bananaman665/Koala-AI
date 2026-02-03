'use client'

import { useRef } from 'react'
import { Clock } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Database } from '@/lib/supabase'
import { hapticSelection } from '@/lib/haptics'

type LectureWithCourse = Database['public']['Tables']['lectures']['Row'] & {
  courses?: {
    name: string
    code: string
    color: string
  } | null
}

interface VirtualizedLectureListProps {
  lectures: LectureWithCourse[]
  onSelectLecture: (id: string) => void
  emptyMessage?: string
}

export function VirtualizedLectureList({
  lectures,
  onSelectLecture,
  emptyMessage = 'No lectures found',
}: VirtualizedLectureListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: lectures.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  if (lectures.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const lecture = lectures[virtualRow.index]
          const durationMinutes = Math.floor(lecture.duration / 60)
          const formattedDuration =
            durationMinutes >= 60
              ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
              : `${durationMinutes}m`

          const createdDate = new Date(lecture.created_at)
          const now = new Date()
          const diffHours = Math.floor(
            (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
          )
          const dateDisplay =
            diffHours < 24
              ? 'Today'
              : diffHours < 48
              ? 'Yesterday'
              : `${Math.floor(diffHours / 24)} days ago`

          return (
            <div
              key={lecture.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                onClick={() => {
                  hapticSelection()
                  onSelectLecture(lecture.id)
                }}
                className="mx-1 my-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {lecture.title}
                  </h4>
                  <span
                    className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ml-2 ${
                      lecture.transcription_status === 'completed'
                        ? 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400'
                        : lecture.transcription_status === 'failed'
                        ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {lecture.transcription_status === 'completed'
                      ? 'Completed'
                      : lecture.transcription_status === 'failed'
                      ? 'Failed'
                      : lecture.transcription_status === 'processing'
                      ? 'Processing'
                      : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                    <span className="flex items-center">
                      <Clock className="mr-1" />
                      {formattedDuration}
                    </span>
                    <span>{dateDisplay}</span>
                  </div>

                  {lecture.courses && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lecture.courses.code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}