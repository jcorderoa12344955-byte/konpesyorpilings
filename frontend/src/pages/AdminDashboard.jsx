import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { adminAPI, reportsAPI } from '../api/api'
import { FiUsers, FiFileText, FiFlag, FiCheckCircle, FiXCircle, FiSettings, FiMapPin, FiTag } from 'react-icons/fi'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      window.location.href = '/'
      return
    }
    loadDashboard()
  }, [user])

  const loadDashboard = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        adminAPI.getDashboard(),
        reportsAPI.getReports({ status_filter: 'pending' }),
      ])
      setStats(statsRes.data)
      setReports(reportsRes.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewReport = async (reportId, action) => {
    try {
      await reportsAPI.reviewReport(reportId, action)
      loadDashboard()
    } catch (error) {
      console.error('Failed to review report:', error)
      alert('Failed to review report. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/admin/users"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <FiUsers className="w-10 h-10 text-purple-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage users and permissions</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/campuses"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <FiMapPin className="w-10 h-10 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Campus Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add and edit campuses</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/tags"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <FiTag className="w-10 h-10 text-green-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tag Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage tags and filters</p>
            </div>
          </div>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_users}</p>
              </div>
              <FiUsers className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Confessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_confessions}</p>
              </div>
              <FiFileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending_reports}</p>
              </div>
              <FiFlag className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Confessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active_confessions}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pending Reports</h2>
        {reports.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No pending reports</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Reason: {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {report.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Reported {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReviewReport(report.id, 'resolve')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleReviewReport(report.id, 'dismiss')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

