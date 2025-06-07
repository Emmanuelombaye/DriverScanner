import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { ChartBarIcon, CpuChipIcon, ClockIcon } from '@heroicons/react/24/outline';

function PerformanceAnalytics({ driver }) {
  const [metrics, setMetrics] = useState({
    bootTime: [],
    cpuUsage: [],
    gpuUsage: [],
    memoryUsage: []
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await window.electron.invoke('get-performance-metrics', driver);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [driver]);

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  if (!driver) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a driver to view performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-50 rounded-lg">
          <ChartBarIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
          <p className="text-sm text-gray-500">
            Real-time metrics for {driver.name}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Boot Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.bootTime.length > 0
                  ? `${(metrics.bootTime.reduce((acc, curr) => acc + curr.bootTime, 0) / metrics.bootTime.length).toFixed(1)}s`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CpuChipIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average CPU Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.cpuUsage.length > 0
                  ? `${(metrics.cpuUsage.reduce((acc, curr) => acc + curr.usage, 0) / metrics.cpuUsage.length).toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average GPU Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.gpuUsage.length > 0
                  ? `${(metrics.gpuUsage.reduce((acc, curr) => acc + curr.usage, 0) / metrics.gpuUsage.length).toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Boot Time Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Boot Time Impact</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.bootTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis
                  label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  stroke="#6B7280"
                  fontSize={12}
                />
                <Tooltip
                  labelFormatter={formatTime}
                  formatter={(value) => [`${value} seconds`, 'Boot Time']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bootTime"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={{ fill: '#0EA5E9', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0EA5E9' }}
                  name="Boot Time"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Usage Charts */}
        <div className="space-y-6">
          {/* CPU Usage */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">CPU Usage</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.cpuUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis
                    label={{ value: '%', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <Tooltip
                    labelFormatter={formatTime}
                    formatter={(value) => [`${value}%`, 'CPU Usage']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="usage"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    name="CPU Usage"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GPU Usage */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">GPU Usage</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.gpuUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis
                    label={{ value: '%', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <Tooltip
                    labelFormatter={formatTime}
                    formatter={(value) => [`${value}%`, 'GPU Usage']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="usage"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    name="GPU Usage"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceAnalytics; 