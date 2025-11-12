import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Reactions from './Reactions'
import { FiMessageCircle, FiEye, FiBookmark, FiFlag } from 'react-icons/fi'
import { reportsAPI } from '../api/api'

export default function ConfessionCard({ confession }) {
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const bookmarks = localStorage.getItem('bookmarks')
    if (bookmarks) {
      try {
        const bookmarkIds = JSON.parse(bookmarks)
        setIsBookmarked(bookmarkIds.includes(confession.id))
      } catch (error) {
        console.error('Failed to check bookmarks:', error)
      }
    }
  }, [confession.id])

  const handleBookmark = () => {
    const bookmarks = localStorage.getItem('bookmarks')
    let bookmarkIds = bookmarks ? JSON.parse(bookmarks) : []
    
    if (isBookmarked) {
      bookmarkIds = bookmarkIds.filter(id => id !== confession.id)
    } else {
      bookmarkIds.push(confession.id)
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarkIds))
    setIsBookmarked(!isBookmarked)
  }

  const handleReport = async () => {
    if (!window.confirm('Report this confession?')) return
    
    try {
      await reportsAPI.createReport({
        confession_id: confession.id,
        reason: 'inappropriate',
        description: 'User reported this confession',
      })
      alert('Report submitted. Thank you for keeping the community safe.')
    } catch (error) {
      console.error('Failed to report:', error)
      alert('Failed to submit report. Please try again.')
    }
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            {confession.anonymous_id || 'Anonymous'}
          </span>
          {confession.gender_tag && (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              {confession.gender_tag}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDistanceToNow(new Date(confession.created_at), { addSuffix: true })}
        </span>
      </div>
      
      <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">
        {confession.content}
      </p>

      {confession.tag && (
        <div className="mb-4">
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            #{confession.tag.name}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Reactions confessionId={confession.id} reactionCounts={confession.reaction_counts} />
        <div className="flex items-center space-x-4">
          <Link
            to={`/confession/${confession.id}`}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
          >
            <FiMessageCircle />
            <span>{confession.comment_count || 0}</span>
            <FiEye className="ml-4" />
            <span>{confession.view_count || 0}</span>
          </Link>
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <FiBookmark className={isBookmarked ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleReport}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
            title="Report"
          >
            <FiFlag />
          </button>
        </div>
      </div>
    </div>
  )
}

