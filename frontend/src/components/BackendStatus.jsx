import { useState, useEffect } from 'react'
import { FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'

export default function BackendStatus() {
  const [status, setStatus] = useState('checking')
  const [show, setShow] = useState(false)

  const checkBackend = async () => {
    setStatus('checking')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      
      const response = await fetch('/api/', { 
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        setStatus('online')
        setShow(false)
      } else {
        setStatus('error')
        setShow(true)
      }
    } catch (error) {
      setStatus('error')
      setShow(true)
    }
  }

  useEffect(() => {
    checkBackend()
    const interval = setInterval(checkBackend, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  if (!show && status === 'online') return null

  return (
    <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {status === 'error' ? (
            <FiAlertCircle className="text-red-600 dark:text-red-400 mr-2" />
          ) : (
            <FiRefreshCw className="text-red-600 dark:text-red-400 mr-2 animate-spin" />
          )}
          <div>
            <p className="text-red-800 dark:text-red-200 font-medium">
              Backend server is not running
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              Please start the backend server: <code className="bg-red-100 dark:bg-red-800 px-2 py-1 rounded">.\run.ps1</code>
            </p>
          </div>
        </div>
        <button
          onClick={checkBackend}
          className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded"
          title="Check again"
        >
          <FiRefreshCw />
        </button>
      </div>
    </div>
  )
}

