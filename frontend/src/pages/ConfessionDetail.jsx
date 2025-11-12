import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { confessionsAPI, commentsAPI } from '../api/api'
import Reactions from '../components/Reactions'
import CommentSection from '../components/CommentSection'
import { FiArrowLeft, FiFlag } from 'react-icons/fi'
import { reportsAPI } from '../api/api'

export default function ConfessionDetail() {
  const { id } = useParams()
  const [confession, setConfession] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfession()
    loadComments()
  }, [id])

  const loadConfession = async () => {
    try {
      const res = await confessionsAPI.getConfession(id)
      setConfession(res.data)
    } catch (error) {
      console.error('Failed to load confession:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const res = await commentsAPI.getComments(id)
      setComments(res.data)
    } catch (error) {
      console.error('Failed to load comments:', error)
    }
  }

  const handleReport = async () => {
    if (!window.confirm('Report this confession?')) return
    try {
      await reportsAPI.createReport({
        confession_id: parseInt(id),
        reason: 'inappropriate',
        description: 'User reported this confession',
      })
      alert('Report submitted. Thank you for keeping the community safe.')
    } catch (error) {
      console.error('Failed to report:', error)
      alert('Failed to submit report. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!confession) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Confession not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Back to feed
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-medium text-purple-600 dark:text-purple-400">
              {confession.anonymous_id || 'Anonymous'}
            </span>
            {confession.gender_tag && (
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                {confession.gender_tag}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(confession.created_at), { addSuffix: true })}
            </span>
            <button
              onClick={handleReport}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              title="Report"
            >
              <FiFlag />
            </button>
          </div>
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

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Reactions confessionId={confession.id} reactionCounts={confession.reaction_counts} />
        </div>
      </div>

      <CommentSection confessionId={confession.id} comments={comments} onCommentAdded={loadComments} />
    </div>
  )
}

