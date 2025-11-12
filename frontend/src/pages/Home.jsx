import { useState, useEffect } from 'react'
import { useCampusStore } from '../store/campusStore'
import { confessionsAPI, campusesAPI } from '../api/api'
import ConfessionCard from '../components/ConfessionCard'
import ConfessionForm from '../components/ConfessionForm'
import { FiFilter, FiSearch } from 'react-icons/fi'

export default function Home() {
  const { selectedCampus } = useCampusStore()
  const [confessions, setConfessions] = useState([])
  const [campuses, setCampuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadCampuses()
  }, [])

  useEffect(() => {
    loadConfessions()
  }, [selectedCampus, sortBy, page])

  const loadCampuses = async () => {
    try {
      setLoading(true)
      const res = await campusesAPI.getCampuses()
      const campuses = res.data
      setCampuses(campuses)
      if (!selectedCampus && campuses.length > 0) {
        useCampusStore.getState().setCampus(campuses[0])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load campuses:', error)
      setLoading(false)
    }
  }

  const loadConfessions = async () => {
    if (!selectedCampus) return
    setLoading(true)
    try {
      const res = await confessionsAPI.getConfessions({
        campus_id: selectedCampus.id,
        sort_by: sortBy,
        skip: (page - 1) * 20,
        limit: 20,
      })
      if (page === 1) {
        setConfessions(res.data)
      } else {
        setConfessions([...confessions, ...res.data])
      }
    } catch (error) {
      console.error('Failed to load confessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadConfessions()
      return
    }
    setLoading(true)
    try {
      const { searchAPI } = await import('../api/api')
      const res = await searchAPI.search({
        q: searchQuery,
        campus_id: selectedCampus?.id,
        sort_by: sortBy,
      })
      setConfessions(res.data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfessionCreated = () => {
    setShowForm(false)
    setPage(1)
    loadConfessions()
  }

  if (loading && campuses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading campuses...</p>
        </div>
      </div>
    )
  }

  if (!selectedCampus) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please select a campus first</p>
          {campuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {campuses.map((campus) => (
                <button
                  key={campus.id}
                  onClick={() => {
                    useCampusStore.getState().setCampus(campus)
                  }}
                  className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left"
                >
                  <h3 className="text-xl font-bold mb-2">{campus.name}</h3>
                  {campus.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{campus.description}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-400">No campuses available. Please contact an administrator.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {selectedCampus.name} Confess Wall
        </h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search confessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="recent">Most Recent</option>
            <option value="reactions">Most Reacted</option>
            <option value="comments">Most Commented</option>
            <option value="trending">Trending</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {showForm ? 'Cancel' : 'New Confession'}
          </button>
        </div>

        {showForm && (
          <ConfessionForm
            campusId={selectedCampus.id}
            onSuccess={handleConfessionCreated}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>

      {loading && confessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading confessions...</p>
        </div>
      ) : confessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No confessions yet. Be the first to confess!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {confessions.map((confession) => (
            <ConfessionCard key={confession.id} confession={confession} />
          ))}
          {confessions.length >= 20 && (
            <button
              onClick={() => setPage(page + 1)}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  )
}

