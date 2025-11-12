import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { commentsAPI } from '../api/api'
import { FiFlag } from 'react-icons/fi'
import { reportsAPI } from '../api/api'

export default function CommentSection({ confessionId, comments: initialComments, onCommentAdded }) {
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState({})

  const loadReplies = async (commentId) => {
    try {
      const res = await commentsAPI.getReplies(commentId)
      const replies = res.data
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, replies } : c))
      )
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }))
    } catch (error) {
      console.error('Failed to load replies:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await commentsAPI.createComment({
        confession_id: confessionId,
        content,
        nickname: nickname || null,
      })
      setContent('')
      setNickname('')
      if (onCommentAdded) {
        onCommentAdded()
      } else {
        // Reload comments
        const res = await commentsAPI.getComments(confessionId)
        setComments(res.data)
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert('Failed to post comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async (commentId) => {
    if (!window.confirm('Report this comment?')) return
    try {
      await reportsAPI.createReport({
        comment_id: commentId,
        reason: 'inappropriate',
        description: 'User reported this comment',
      })
      alert('Report submitted. Thank you for keeping the community safe.')
    } catch (error) {
      console.error('Failed to report:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Comments</h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname (optional)"
          className="w-full mb-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full mb-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {comment.nickname || comment.anonymous_id || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <button
                onClick={() => handleReport(comment.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-700"
                title="Report"
              >
                <FiFlag className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-800 dark:text-gray-200 mb-2">{comment.content}</p>
            {comment.reply_count > 0 && !expandedReplies[comment.id] && (
              <button
                onClick={() => loadReplies(comment.id)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700"
              >
                View {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
              </button>
            )}
            {expandedReplies[comment.id] && comment.replies && (
              <div className="ml-6 mt-2 space-y-2">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {reply.nickname || reply.anonymous_id || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  )
}

