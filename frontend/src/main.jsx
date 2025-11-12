import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error)
  const root = document.getElementById('root')
  if (root && !root.innerHTML) {
    root.innerHTML = `
      <div style="padding: 50px; background: #fee; border: 2px solid red; margin: 20px;">
        <h1 style="color: red;">JavaScript Error Detected</h1>
        <p>Error: ${event.error?.message || 'Unknown error'}</p>
        <p>Check browser console (F12) for details.</p>
      </div>
    `
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

// Render React app
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<h1 style="color: red;">Error: Root element not found!</h1>'
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  } catch (error) {
    console.error('Error rendering React app:', error)
    rootElement.innerHTML = `
      <div style="padding: 50px; background: #fee; border: 2px solid red; margin: 20px;">
        <h1 style="color: red;">React Rendering Error</h1>
        <p>Error: ${error.message}</p>
        <p>Check browser console (F12) for details.</p>
      </div>
    `
  }
}

