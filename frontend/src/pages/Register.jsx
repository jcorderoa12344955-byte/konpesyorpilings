import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI, campusesAPI } from '../api/api'
import { useCampusStore } from '../store/campusStore'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [campusId, setCampusId] = useState('')
  const [campuses, setCampuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCampuses()
  }, [])

  const loadCampuses = async () => {
    try {
      const res = await campusesAPI.getCampuses()
      setCampuses(res.data)
      if (res.data.length > 0) {
        setCampusId(res.data[0].id)
      }
    } catch (error) {
      console.error('Failed to load campuses:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.register({
        email,
        password,
        campus_id: campusId ? parseInt(campusId) : null,
      })
      // Auto login after registration
      const loginRes = await authAPI.login({ email, password })
      const loggedUser = loginRes.data.user
      setAuth(loginRes.data.access_token, loggedUser)
      // Set campus selection to the one chosen during registration
      try {
        if (loggedUser?.campus_id) {
          const campusRes = await campusesAPI.getCampus(loggedUser.campus_id)
          useCampusStore.getState().setCampus(campusRes.data)
        } else if (campusId) {
          const campusRes = await campusesAPI.getCampus(parseInt(campusId))
          useCampusStore.getState().setCampus(campusRes.data)
        }
      } catch (e) {
        // Campus will be set on next page load
      }
      navigate('/')
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Email address"
              />
            </div>
            <div>
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="">Select campus</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Password"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Confirm password"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
          <div className="text-center">
            <a href="/login" className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

