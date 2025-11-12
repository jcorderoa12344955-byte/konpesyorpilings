import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { authAPI, confessionsAPI } from '../api/api'
import { FiUser, FiBookmark, FiEdit2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import ConfessionCard from '../components/ConfessionCard'

export default function Profile() {
  const { token, user, setAuth } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!token) {
      window.location.href = '/login'
      return
    }
    loadProfile()
  }, [token])

  const loadProfile = async () => {
    try {
      const res = await authAPI.getMe()
      setProfile(res.data)
      // Load bookmarks from localStorage (client-side only)
      const savedBookmarks = localStorage.getItem('bookmarks')
      if (savedBookmarks) {
        try {
          const bookmarkIds = JSON.parse(savedBookmarks)
          // Load confession details for bookmarks
          const bookmarkPromises = bookmarkIds.map(id => 
            confessionsAPI.getConfession(id).catch(() => null)
          )
          const bookmarkResults = await Promise.all(bookmarkPromises)
          setBookmarks(bookmarkResults.filter(b => b !== null).map(b => b.data))
        } catch (error) {
          console.error('Failed to load bookmarks:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBookmark = (confessionId) => {
    const savedBookmarks = localStorage.getItem('bookmarks')
    if (savedBookmarks) {
      try {
        const bookmarkIds = JSON.parse(savedBookmarks)
        const updated = bookmarkIds.filter(id => id !== confessionId)
        localStorage.setItem('bookmarks', JSON.stringify(updated))
        setBookmarks(bookmarks.filter(b => b.id !== confessionId))
      } catch (error) {
        console.error('Failed to remove bookmark:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
            <FiUser className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile?.name || 'User'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
            {profile?.role && (
              <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                profile.role === 'admin'
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : profile.role === 'moderator'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}>
                {profile.role}
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'profile'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FiUser className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'bookmarks'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FiBookmark className="inline mr-2" />
            Bookmarks ({bookmarks.length})
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{profile?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <p className="text-gray-900 dark:text-white capitalize">{profile?.role || 'user'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <p className="text-gray-900 dark:text-white">{profile?.id}</p>
            </div>
            {profile?.campus && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campus
                </label>
                <p className="text-gray-900 dark:text-white">{profile.campus.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div>
          {bookmarks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <FiBookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No bookmarks yet</p>
              <Link
                to="/"
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Browse Confessions
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((confession) => (
                <div key={confession.id} className="relative">
                  <ConfessionCard confession={confession} />
                  <button
                    onClick={() => handleRemoveBookmark(confession.id)}
                    className="absolute top-4 right-4 p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                    title="Remove bookmark"
                  >
                    <FiBookmark className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

