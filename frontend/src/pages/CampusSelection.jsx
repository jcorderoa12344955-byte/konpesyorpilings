import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '../store/campusStore'
import { campusesAPI } from '../api/api'

export default function CampusSelection() {
  const navigate = useNavigate()
  const { selectedCampus, setCampus } = useCampusStore()
  const [campuses, setCampuses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampuses()
  }, [])

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

  const handleSelectCampus = (campus) => {
    setCampus(campus)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading campuses...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
        Select Your Campus
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campuses.map((campus) => (
          <button
            key={campus.id}
            onClick={() => handleSelectCampus(campus)}
            className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left ${
              selectedCampus?.id === campus.id
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
          >
            <h3 className="text-xl font-bold mb-2">{campus.name}</h3>
            {campus.description && (
              <p className="text-sm opacity-80">{campus.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

