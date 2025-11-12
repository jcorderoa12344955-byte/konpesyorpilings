import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { adminAPI } from '../api/api'
import { FiUsers, FiXCircle, FiCheckCircle, FiSearch } from 'react-icons/fi'

export default function AdminUsers() {
  const { user, token } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBanned, setFilterBanned] = useState('all')

  useEffect(() => {
    // Check if user is logged in
    if (!token || !user) {
      setError('You must be logged in to access this page.')
      setLoading(false)
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      return
    }
    
    // Check if user has admin/moderator role
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      setError('You do not have permission to access this page. Admin or Moderator role required.')
      setLoading(false)
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      return
    }
    
    loadUsers()
  }, [user, token])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      
      const res = await adminAPI.getUsers({ skip: 0, limit: 100 })
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data)
      } else {
        console.error('Invalid response format:', res.data)
        setUsers([])
        setError('Invalid response format from server')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Redirecting to login...')
        // Clear auth store and redirect
        const { logout } = useAuthStore.getState()
        logout()
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view users. Admin or Moderator role required.')
      } else {
        setError(error.response?.data?.detail || error.message || 'Failed to load users. Please try again.')
      }
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId, isBanned) => {
    if (!window.confirm(`Are you sure you want to ${isBanned ? 'ban' : 'unban'} this user?`)) return
    
    try {
      await adminAPI.banUser(userId, isBanned)
      loadUsers()
    } catch (error) {
      console.error('Failed to ban user:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to ban user. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all their confessions, comments, and reactions.')) return
    
    try {
      await adminAPI.deleteUser(userId)
      loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      
      let errorMessage = 'Failed to delete user. Please try again.'
      
      if (error.response) {
        if (error.response.status === 405) {
          errorMessage = 'Method not allowed. Please check if the backend server is running correctly.'
        } else if (error.response.status === 404) {
          errorMessage = 'User not found.'
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.detail || 'Invalid request.'
        } else if (error.response.status === 403) {
          errorMessage = error.response.data?.detail || 'You do not have permission to delete this user.'
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        } else {
          errorMessage = `Server error (${error.response.status}). Please try again.`
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:8000'
      } else {
        errorMessage = error.message || 'An unexpected error occurred.'
      }
      
      alert(errorMessage)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = 
      filterBanned === 'all' ||
      (filterBanned === 'banned' && u.is_banned) ||
      (filterBanned === 'active' && !u.is_banned)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading users...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiXCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterBanned}
            onChange={(e) => setFilterBanned(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiUsers className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {u.name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {u.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{u.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    u.role === 'admin' 
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : u.role === 'moderator'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u.is_banned ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      Banned
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBanUser(u.id, !u.is_banned)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
                        u.is_banned
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {u.is_banned ? (
                        <>
                          <FiCheckCircle />
                          <span>Unban</span>
                        </>
                      ) : (
                        <>
                          <FiXCircle />
                          <span>Ban</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm bg-red-800 text-white hover:bg-red-900"
                      disabled={u.id === user?.id}
                      title={u.id === user?.id ? "Cannot delete yourself" : "Delete user"}
                    >
                      <FiXCircle />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}

