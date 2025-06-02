import { useState, useEffect } from 'react';
import { ShieldExclamationIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function SecurityChecks({ driver }) {
  const [securityData, setSecurityData] = useState({
    vulnerabilities: [],
    lastChecked: null,
    status: 'checking'
  });

  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const data = await window.electron.invoke('check-driver-security', driver);
        setSecurityData(data);
      } catch (error) {
        console.error('Error checking security:', error);
        setSecurityData(prev => ({ ...prev, status: 'error' }));
      }
    };

    checkSecurity();
  }, [driver]);

  const getStatusColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (!driver) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a driver to check security status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-50 rounded-lg">
          <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Security Status</h2>
          <p className="text-sm text-gray-500">
            Vulnerability check for {driver.name}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {securityData.status === 'safe' ? (
              <div className="p-2 bg-green-50 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              </div>
            ) : securityData.status === 'vulnerable' ? (
              <div className="p-2 bg-red-50 rounded-lg">
                <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
              </div>
            ) : (
              <div className="p-2 bg-yellow-50 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {securityData.status === 'safe' ? 'No Vulnerabilities Found' :
                 securityData.status === 'vulnerable' ? 'Vulnerabilities Detected' :
                 'Security Check Failed'}
              </h3>
              <p className="text-sm text-gray-500">
                Last checked: {securityData.lastChecked ? new Date(securityData.lastChecked).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
          <button
            onClick={() => checkSecurity()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {securityData.status === 'checking' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-500">Checking security status...</p>
          </div>
        </div>
      )}

      {securityData.status === 'error' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-center space-x-3 text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <p>Failed to check security status</p>
          </div>
        </div>
      )}

      {securityData.vulnerabilities.length > 0 && (
        <div className="space-y-4">
          {securityData.vulnerabilities.map((vuln) => (
            <div
              key={vuln.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{vuln.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>CVE: {vuln.cveId}</span>
                    <span>Published: {new Date(vuln.publishedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(vuln.severity)}`}>
                  {vuln.severity}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{vuln.description}</p>
              {vuln.recommendation && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendation</h4>
                  <p className="text-sm text-gray-600">{vuln.recommendation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {securityData.status === 'safe' && securityData.vulnerabilities.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="p-3 bg-green-50 rounded-full mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Known Vulnerabilities</h3>
            <p className="text-gray-500 max-w-md">
              This driver has been checked against the National Vulnerability Database and no known security issues were found.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityChecks; 