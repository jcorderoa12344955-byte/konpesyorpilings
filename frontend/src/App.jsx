import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore } from './store/themeStore'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import BackendStatus from './components/BackendStatus'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ConfessionDetail from './pages/ConfessionDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminCampuses from './pages/AdminCampuses'
import AdminTags from './pages/AdminTags'
import AdminConfessions from './pages/AdminConfessions'
import Profile from './pages/Profile'
import CampusSelection from './pages/CampusSelection'

function App() {
  const { isDark, loadTheme } = useThemeStore()

  useEffect(() => {
    try {
      loadTheme()
    } catch (error) {
      console.error('Error loading theme:', error)
    }
  }, [loadTheme])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4">
            <BackendStatus />
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/confession/:id" element={<ConfessionDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/confessions" element={<AdminConfessions />} />
            <Route path="/admin/campuses" element={<AdminCampuses />} />
            <Route path="/admin/tags" element={<AdminTags />} />
            <Route path="/campus" element={<CampusSelection />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App

