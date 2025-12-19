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
      console.log('Scanned drivers:', result)
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
          <div className={`rounded-xl shadow-sm p-6 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Error Analysis
                </h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Paste any driver or system error message and we&apos;ll estimate its severity.
                </p>
              </div>
              {errorSeverity && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    errorSeverity === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                      : errorSeverity === 'WARNING'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                  }`}
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errorSeverity}
                </span>
              )}
            </div>
            <div className="space-y-3">
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
                placeholder="Example: 'The device cannot start. (Code 10)' or any driver-related log..."
                className={`w-full rounded-lg border text-sm resize-none ${
                  isDarkMode
                    ? 'bg-gray-900/60 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                rows={4}
              />
            </div>
          </div>

          {/* Driver Overview + List */}
          <div className="space-y-4">
            {/* Overview cards */}
            {drivers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`rounded-xl p-4 border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Total Drivers
                  </p>
                  <p className={`mt-2 text-2xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {drivers.length}
                  </p>
                </div>
                <div className={`rounded-xl p-4 border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Healthy
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-500">
                    {drivers.filter(d => d.status === 'OK').length}
                  </p>
                </div>
                <div className={`rounded-xl p-4 border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Issues Detected
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-amber-400">
                    {drivers.filter(d => d.status !== 'OK').length}
                  </p>
                </div>
              </div>
            )}

            {/* Driver List */}
            <div className={`rounded-xl shadow-sm overflow-hidden border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={isDarkMode ? 'bg-gray-700/70' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Device Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Driver Version
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    {drivers.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-6 py-10 text-center text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          No drivers loaded yet. Click <span className="font-semibold">Scan Drivers</span> to
                          analyze your system.
                        </td>
                      </tr>
                    )}

                    {drivers.map((driver) => (
                      <tr
                        key={driver.deviceId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors duration-150"
                      >
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {driver.deviceName}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {driver.driverVersion || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              driver.status === 'OK'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                : driver.status === 'Warning'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                            }`}
                          >
                            {driver.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => rollbackDriver(driver.deviceId)}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                              isDarkMode
                                ? 'text-white bg-red-600 hover:bg-red-700'
                                : 'text-white bg-red-600 hover:bg-red-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                              isDarkMode ? 'focus:ring-offset-gray-900' : ''
                            }`}
                          >
                            Rollback
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 