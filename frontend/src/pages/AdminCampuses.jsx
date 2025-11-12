import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { campusesAPI } from '../api/api'
import { FiPlus, FiEdit, FiTrash2, FiMapPin } from 'react-icons/fi'

export default function AdminCampuses() {
  const { user } = useAuthStore()
  const [campuses, setCampuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCampus, setEditingCampus] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      window.location.href = '/'
      return
    }
    loadCampuses()
  }, [user])

  const loadCampuses = async () => {
    try {
      const res = await campusesAPI.getCampuses()
      setCampuses(res.data)
    } catch (error) {
      console.error('Failed to load campuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCampus) {
        await campusesAPI.updateCampus(editingCampus.id, formData)
      } else {
        await campusesAPI.createCampus(formData)
      }
      setShowForm(false)
      setEditingCampus(null)
      setFormData({ name: '', description: '' })
      loadCampuses()
    } catch (error) {
      console.error('Failed to save campus:', error)
      alert('Failed to save campus. Please try again.')
    }
  }

  const handleEdit = (campus) => {
    setEditingCampus(campus)
    setFormData({ name: campus.name, description: campus.description || '' })
    setShowForm(true)
  }

  const handleDelete = async (campusId) => {
    if (!window.confirm('Are you sure you want to delete this campus?')) return
    
    try {
      await campusesAPI.deleteCampus(campusId)
      loadCampuses()
    } catch (error) {
      console.error('Failed to delete campus:', error)
      alert('Failed to delete campus. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading campuses...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campus Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingCampus(null)
            setFormData({ name: '', description: '' })
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <FiPlus />
          <span>{showForm ? 'Cancel' : 'Add Campus'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {editingCampus ? 'Edit Campus' : 'Add New Campus'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campus Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {editingCampus ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCampus(null)
                  setFormData({ name: '', description: '' })
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campuses.map((campus) => (
          <div
            key={campus.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FiMapPin className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {campus.name}
                </h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(campus)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => handleDelete(campus.id)}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            {campus.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{campus.description}</p>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ID: {campus.id}
            </div>
          </div>
        ))}
      </div>
      {campuses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No campuses yet. Add one to get started!</p>
        </div>
      )}
    </div>
  )
}

