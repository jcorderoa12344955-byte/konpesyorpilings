import { useState, useEffect } from 'react'
import { reactionsAPI } from '../api/api'
import { FiHeart, FiSmile, FiMeh, FiFrown, FiZap, FiThumbsUp } from 'react-icons/fi'

const reactionTypes = [
  { type: 'like', icon: FiThumbsUp, label: 'Like' },
  { type: 'heart', icon: FiHeart, label: 'Heart' },
  { type: 'laugh', icon: FiSmile, label: 'Laugh' },
  { type: 'shock', icon: FiZap, label: 'Shock' },
  { type: 'cry', icon: FiFrown, label: 'Cry' },
  { type: 'angry', icon: FiMeh, label: 'Angry' },
]

export default function Reactions({ confessionId, reactionCounts: initialCounts }) {
  const [reactionCounts, setReactionCounts] = useState(initialCounts || {})
  const [userReaction, setUserReaction] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReactions()
  }, [confessionId])

  const loadReactions = async () => {
    try {
      const res = await reactionsAPI.getConfessionReactions(confessionId)
      setReactionCounts(res.data)
    } catch (error) {
      console.error('Failed to load reactions:', error)
    }
  }

  const handleReaction = async (reactionType) => {
    if (loading) return
    setLoading(true)
    try {
      if (userReaction === reactionType) {
        // Remove reaction
        // Note: You'd need to track reaction ID to delete
        await reactionsAPI.createReaction({
          confession_id: confessionId,
          reaction_type: reactionType,
        })
        setUserReaction(null)
      } else {
        await reactionsAPI.createReaction({
          confession_id: confessionId,
          reaction_type: reactionType,
        })
        setUserReaction(reactionType)
      }
      loadReactions()
    } catch (error) {
      console.error('Failed to react:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {reactionTypes.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => handleReaction(type)}
          disabled={loading}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
            userReaction === type
              ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title={label}
        >
          <Icon />
          <span className="text-sm">{reactionCounts[type] || 0}</span>
        </button>
      ))}
    </div>
  )
}

