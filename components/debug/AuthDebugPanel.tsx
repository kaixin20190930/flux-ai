'use client';

import React, { useState, useEffect } from 'react';
import { authStateDebugger, AuthStateSnapshot, AuthStateInconsistency, AuthDebugLog } from '../../utils/authStateDebugger';

interface AuthDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({ isOpen, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<{
    logs: AuthDebugLog[];
    snapshots: AuthStateSnapshot[];
    currentState: AuthStateSnapshot;
    inconsistencies: AuthStateInconsistency[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'state' | 'logs' | 'inconsistencies' | 'tools'>('state');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshDebugInfo();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(refreshDebugInfo, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  const refreshDebugInfo = () => {
    const info = authStateDebugger.getDebugInfo();
    setDebugInfo(info);
  };

  const handleAutoFix = async () => {
    const result = await authStateDebugger.autoFix();
    alert(`Fixed ${result.fixed} issues. Errors: ${result.errors.join(', ')}`);
    refreshDebugInfo();
  };

  const handleClearLogs = () => {
    authStateDebugger.clearDebugData();
    refreshDebugInfo();
  };

  const handleExportData = () => {
    const data = authStateDebugger.exportDebugData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateScenario = (scenario: 'token_expired' | 'user_logout' | 'storage_corruption') => {
    authStateDebugger.simulateScenario(scenario);
    refreshDebugInfo();
  };

  if (!isOpen || !debugInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Authentication Debug Panel</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto Refresh</span>
            </label>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { key: 'state', label: 'Current State' },
              { key: 'logs', label: `Logs (${debugInfo.logs.length})` },
              { key: 'inconsistencies', label: `Issues (${debugInfo.inconsistencies.length})` },
              { key: 'tools', label: 'Tools' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[60vh]">
          {activeTab === 'state' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StateCard title="Manager State" data={debugInfo.currentState.manager} />
                <StateCard title="LocalStorage" data={debugInfo.currentState.localStorage} />
                <StateCard title="Cookies" data={debugInfo.currentState.cookies} />
                <StateCard title="SessionStorage" data={debugInfo.currentState.sessionStorage} />
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {debugInfo.logs.slice().reverse().map((log, index) => (
                <LogEntry key={index} log={log} />
              ))}
            </div>
          )}

          {activeTab === 'inconsistencies' && (
            <div className="space-y-4">
              {debugInfo.inconsistencies.length === 0 ? (
                <div className="text-green-600 text-center py-8">
                  ✅ No inconsistencies detected
                </div>
              ) : (
                debugInfo.inconsistencies.map((issue, index) => (
                  <InconsistencyCard key={index} issue={issue} />
                ))
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={refreshDebugInfo}
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Refresh Data
                    </button>
                    <button
                      onClick={handleAutoFix}
                      className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Auto Fix Issues
                    </button>
                    <button
                      onClick={handleClearLogs}
                      className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Clear Logs
                    </button>
                    <button
                      onClick={handleExportData}
                      className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                    >
                      Export Debug Data
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Simulate Scenarios</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSimulateScenario('token_expired')}
                      className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm"
                    >
                      Token Expired
                    </button>
                    <button
                      onClick={() => handleSimulateScenario('user_logout')}
                      className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                    >
                      User Logout
                    </button>
                    <button
                      onClick={() => handleSimulateScenario('storage_corruption')}
                      className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      Storage Corruption
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StateCard: React.FC<{ title: string; data: any }> = ({ title, data }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-semibold mb-2">{title}</h3>
    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

const LogEntry: React.FC<{ log: AuthDebugLog }> = ({ log }) => {
  const levelColors = {
    info: 'text-blue-600',
    warn: 'text-yellow-600',
    error: 'text-red-600',
    debug: 'text-green-600'
  };

  return (
    <div className="bg-gray-50 p-3 rounded border-l-4 border-l-gray-300">
      <div className="flex justify-between items-start mb-1">
        <span className={`font-semibold ${levelColors[log.level]}`}>
          [{log.level.toUpperCase()}] {log.action}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <pre className="text-xs text-gray-700 overflow-auto max-h-20">
        {JSON.stringify(log.data, null, 2)}
      </pre>
      {log.stackTrace && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">Stack Trace</summary>
          <pre className="text-xs text-gray-600 mt-1 overflow-auto max-h-32">
            {log.stackTrace}
          </pre>
        </details>
      )}
    </div>
  );
};

const InconsistencyCard: React.FC<{ issue: AuthStateInconsistency }> = ({ issue }) => {
  const severityColors = {
    low: 'border-l-yellow-400 bg-yellow-50',
    medium: 'border-l-orange-400 bg-orange-50',
    high: 'border-l-red-400 bg-red-50'
  };

  return (
    <div className={`p-4 rounded border-l-4 ${severityColors[issue.severity]}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold">{issue.type.replace('_', ' ').toUpperCase()}</h4>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs rounded ${
            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
            issue.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {issue.severity}
          </span>
          {issue.autoFixable && (
            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
              Auto-fixable
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-3">{issue.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <strong>Expected:</strong>
          <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-20">
            {JSON.stringify(issue.expected, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Actual:</strong>
          <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-20">
            {JSON.stringify(issue.actual, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};