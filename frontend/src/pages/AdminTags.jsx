import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { tagsAPI } from '../api/api'
import { FiPlus, FiCheck, FiX, FiTrash2, FiTag } from 'react-icons/fi'

export default function AdminTags() {
  const { user } = useAuthStore()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tagName, setTagName] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      window.location.href = '/'
      return
    }
    loadTags()
  }, [user])

  const loadTags = async () => {
    try {
      const res = await tagsAPI.getTags()
      setTags(res.data)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!tagName.trim()) return
    
    try {
      await tagsAPI.createTag({ name: tagName.trim() })
      setTagName('')
      setShowForm(false)
      loadTags()
    } catch (error) {
      console.error('Failed to create tag:', error)
      alert('Failed to create tag. Please try again.')
    }
  }

  const handleToggleTag = async (tagId, isAllowed) => {
    try {
      await tagsAPI.toggleTag(tagId, !isAllowed)
      loadTags()
    } catch (error) {
      console.error('Failed to toggle tag:', error)
      alert('Failed to toggle tag. Please try again.')
    }
  }

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return
    
    try {
      await tagsAPI.deleteTag(tagId)
      loadTags()
    } catch (error) {
      console.error('Failed to delete tag:', error)
      alert('Failed to delete tag. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading tags...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tag Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <FiPlus />
          <span>{showForm ? 'Cancel' : 'Add Tag'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Tag</h2>
          <form onSubmit={handleCreateTag} className="flex space-x-4">
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Tag name (e.g., love, rant, crush)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setTagName('')
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Usage Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tags.map((tag) => (
              <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiTag className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{tag.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tag.is_allowed ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Allowed
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      Blocked
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {tag.usage_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleTag(tag.id, tag.is_allowed)}
                      className={`p-2 rounded-lg ${
                        tag.is_allowed
                          ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800'
                          : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800'
                      }`}
                      title={tag.is_allowed ? 'Block Tag' : 'Allow Tag'}
                    >
                      {tag.is_allowed ? <FiX /> : <FiCheck />}
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                      title="Delete Tag"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tags.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No tags yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

