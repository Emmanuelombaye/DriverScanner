import { useState, useEffect } from 'react'
import { 
  ArrowPathIcon,
  SunIcon,
  MoonIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { toast, Toaster } from 'react-hot-toast'

function App() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [errorSeverity, setErrorSeverity] = useState('INFO')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isElectronReady, setIsElectronReady] = useState(false)

  useEffect(() => {
    // Check if electron API is available
    const checkElectron = () => {
      if (window.electron) {
        setIsElectronReady(true)
        loadSystemInfo()
        loadThemePreference()
      } else {
        console.log('Running in browser environment')
        // Set default theme for browser
        setIsDarkMode(false)
        document.documentElement.classList.remove('dark')
      }
    }

    // Initial check
    checkElectron()

    // Check again after a short delay (in case electron takes time to initialize)
    const timeoutId = setTimeout(checkElectron, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  const loadThemePreference = async () => {
    if (!isElectronReady) return
    
    try {
      const theme = await window.electron.invoke('get-theme')
      setIsDarkMode(theme === 'dark')
      document.documentElement.classList.toggle('dark', theme === 'dark')
    } catch (error) {
      console.error('Error loading theme preference:', error)
    }
  }

  const toggleTheme = async () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    document.documentElement.classList.toggle('dark', newTheme)
    
    if (isElectronReady) {
      try {
        await window.electron.invoke('set-theme', newTheme ? 'dark' : 'light')
      } catch (error) {
        console.error('Error saving theme preference:', error)
      }
    }
  }

  const loadSystemInfo = async () => {
    if (!isElectronReady) {
      setSystemInfo({
        os: 'Browser',
        version: 'N/A',
        architecture: 'N/A'
      })
      return
    }
    
    try {
      const info = await window.electron.invoke('get-system-info')
      setSystemInfo(info)
    } catch (error) {
      console.error('Error loading system info:', error)
      toast.error('Failed to load system information')
    }
  }

  const scanDrivers = async () => {
    if (!isElectronReady) {
      toast.error('Driver scanning is only available in the desktop application')
      return
    }

    setIsLoading(true)
    setDrivers([]) // Clear existing drivers before scan
    
    try {
      const result = await window.electron.invoke('scan-drivers')
      
      if (!result || !Array.isArray(result)) {
        throw new Error('Invalid driver data received')
      }
      
      if (result.length === 0) {
        toast.warning('No drivers found in the system')
      } else {
        toast.success(`Successfully scanned ${result.length} drivers`)
      }
      
      setDrivers(result)
    } catch (error) {
      console.error('Error scanning drivers:', error)
      const errorMessage = error?.message || 'Failed to scan drivers. Please try again.'
      toast.error(errorMessage)
      setDrivers([])
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeError = async (message) => {
    if (!message || message.trim() === '') {
      setErrorSeverity('INFO')
      return
    }

    if (!isElectronReady) {
      // Simple client-side analysis for browser environment
      const lowerMessage = message.toLowerCase()
      if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
        setErrorSeverity('CRITICAL')
      } else if (lowerMessage.includes('warning')) {
        setErrorSeverity('WARNING')
      } else {
        setErrorSeverity('INFO')
      }
      return
    }

    try {
      const severity = await window.electron.invoke('analyze-error', message)
      console.log('Received severity:', severity)
      setErrorSeverity(severity)
    } catch (error) {
      console.error('Error analyzing error message:', error)
      toast.error('Failed to analyze error message')
      setErrorSeverity('INFO')
    }
  }

  const rollbackDriver = async (deviceId) => {
    if (!isElectronReady) {
      toast.error('Driver rollback is only available in the desktop application')
      return
    }

    try {
      const result = await window.electron.invoke('rollback-driver', deviceId)
      if (result.success) {
        toast.success(result.message)
        scanDrivers() // Refresh the driver list
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error rolling back driver:', error)
      toast.error('Failed to rollback driver')
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className={`sticky top-0 z-40 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              DriverScan Pro
            </h1>
            {systemInfo && (
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {systemInfo.os} {systemInfo.version}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              {isDarkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Driver Management
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={scanDrivers}
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 ${
                  isDarkMode ? 'focus:ring-offset-gray-800' : ''
                }`}
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Scanning...' : 'Scan Drivers'}
              </button>
            </div>
          </div>

          {/* Error Analysis */}
          <div className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Error Analysis
            </h3>
            <div className="space-y-4">
              <textarea
                value={errorMessage}
                onChange={(e) => {
                  setErrorMessage(e.target.value)
                  if (e.target.value) {
                    analyzeError(e.target.value)
                  } else {
                    setErrorSeverity('INFO')
                  }
                }}
                placeholder="Enter error message to analyze..."
                className={`w-full rounded-md border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-primary-500 focus:border-primary-500`}
                rows={4}
              />
              {errorSeverity && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  errorSeverity === 'CRITICAL' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : errorSeverity === 'WARNING'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errorSeverity}
                </div>
              )}
            </div>
          </div>

          {/* Driver List */}
          <div className={`rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Name
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Version
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Manufacturer
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Install Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  {drivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                        selectedDriver?.id === driver.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                      }`}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {driver.name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {driver.version}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {driver.manufacturer}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {driver.installDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            rollbackDriver(driver.deviceId)
                          }}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                            isDarkMode
                              ? 'text-white bg-red-600 hover:bg-red-700'
                              : 'text-white bg-red-600 hover:bg-red-700'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                            isDarkMode ? 'focus:ring-offset-gray-800' : ''
                          }`}
                        >
                          Rollback
                        </button>
                      </td>
                    </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan="5" className={`px-6 py-4 text-center text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        No drivers found. Click "Scan Drivers" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 