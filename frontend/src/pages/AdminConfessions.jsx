import { useEffect, useState } from 'react'
import { adminAPI, campusesAPI } from '../api/api'
import { FiEye, FiFilter, FiUser, FiMapPin, FiTag } from 'react-icons/fi'
import { format } from 'date-fns'
import { useAuthStore } from '../store/authStore'

export default function AdminConfessions() {
  const { user, token } = useAuthStore()
  const [campuses, setCampuses] = useState([])
  const [selectedCampus, setSelectedCampus] = useState('all')
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !user || (user.role !== 'admin' && user.role !== 'moderator')) {
      setError('You do not have permission to access this page.')
      setLoading(false)
      setTimeout(() => (window.location.href = '/'), 1500)
      return
    }
    loadCampuses()
  }, [user, token])

  useEffect(() => {
    if (campuses.length || selectedCampus === 'all') {
      loadConfessions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus])

  const loadCampuses = async () => {
    try {
      const res = await campusesAPI.getCampuses()
      setCampuses(res.data)
    } catch (e) {
      console.error('Failed to load campuses', e)
    }
  }

  const loadConfessions = async () => {
    try {
      setLoading(true)
      setError('')
      const params = { skip: 0, limit: 50 }
      const res =
        selectedCampus === 'all'
          ? await adminAPI.getConfessions(params)
          : await adminAPI.getConfessionsByCampus(selectedCampus, params)
      setConfessions(res.data)
    } catch (e) {
      console.error('Failed to load confessions:', e)
      setError(e.response?.data?.detail || 'Failed to load confessions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Confessions (Admin)</h1>
        <div className="flex items-center space-x-3">
          <FiFilter className="text-gray-500" />
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-400">Loading confessions...</p>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {confessions.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiMapPin className="text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {c.campus?.name || 'Unknown campus'}
                  </span>
                  {c.tag && (
                    <span className="flex items-center text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      <FiTag className="mr-1" />
                      {c.tag.name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(c.created_at), 'PPpp')}
                </span>
              </div>

              <p className="mt-3 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{c.content}</p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-gray-600 dark:text-gray-300">
                    <FiEye className="mr-1" /> {c.view_count} views
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Reactions: {c.reaction_counts ? Object.values(c.reaction_counts).reduce((a, b) => a + b, 0) : 0}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Comments: {c.comment_count || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiUser className="text-gray-500" />
                  {c.author ? (
                    <span className="text-gray-800 dark:text-gray-200">
                      {c.author.email} (ID: {c.author.id}) - role: {c.author.role}
                    </span>
                  ) : (
                    <span className="text-gray-500">Posted fully anonymous (no user attached)</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {confessions.length === 0 && (
            <p className="text-center text-gray-600 dark:text-gray-400">No confessions found.</p>
          )}
        </div>
      )}
    </div>
  )
}
