import { useState, useEffect } from 'react'
import { confessionsAPI, tagsAPI, campusesAPI } from '../api/api'
import { useAuthStore } from '../store/authStore'

export default function ConfessionForm({ campusId, onSuccess, onCancel }) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [genderTag, setGenderTag] = useState('')
  const [tagId, setTagId] = useState('')
  const [selectedCampusId, setSelectedCampusId] = useState(campusId)
  const [tags, setTags] = useState([])
  const [campuses, setCampuses] = useState([])
  const [loading, setLoading] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  useEffect(() => {
    loadTags()
    if (isAdmin) {
      loadCampuses()
    }
  }, [isAdmin])

  const loadTags = async () => {
    try {
      const res = await tagsAPI.getTags()
      setTags(res.data)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const loadCampuses = async () => {
    try {
      const res = await campusesAPI.getCampuses()
      setCampuses(res.data)
    } catch (error) {
      console.error('Failed to load campuses:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      const campusIdToUse = selectedCampusId || campusId
      if (!campusIdToUse) {
        alert('Please select a campus')
        setLoading(false)
        return
      }
      
      const confessionData = {
        content: content.trim(),
        campus_id: parseInt(campusIdToUse),
        gender_tag: genderTag || null,
        tag_id: tagId ? parseInt(tagId) : null,
      }
      
      await confessionsAPI.createConfession(confessionData)
      setContent('')
      setGenderTag('')
      setTagId('')
      onSuccess()
    } catch (error) {
      console.error('Failed to create confession:', error)
      
      let errorMessage = 'Failed to create confession. Please try again.'
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 405) {
          errorMessage = 'Method not allowed. Please check if the backend server is running correctly.'
        } else if (error.response.status === 404) {
          errorMessage = error.response.data?.detail || 'Resource not found. Please check your campus selection.'
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.detail || 'Invalid request. Please check your input.'
        } else if (error.response.status === 403) {
          errorMessage = error.response.data?.detail || 'You are not allowed to perform this action.'
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        } else {
          errorMessage = `Server error (${error.response.status}). Please try again.`
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:8000'
      } else {
        // Error setting up request
        errorMessage = error.message || 'An unexpected error occurred.'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your confession..."
        rows={6}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
        required
      />
      <div className="flex flex-wrap gap-4 mb-4">
        {isAdmin && campuses.length > 0 && (
          <select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            title="Select campus to post in (Admin only)"
          >
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={genderTag}
          onChange={(e) => setGenderTag(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">No gender tag</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Secret">Secret</option>
        </select>
        <select
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">No tag</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              #{tag.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Confession'}
        </button>
      </div>
    </form>
  )
}

