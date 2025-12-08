// ============================================================================
// FILE: src/App.jsx
// ⚠️ THIS IS THE MAIN COMPONENT - COPY EXACTLY AS IS
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, Package, XCircle } from 'lucide-react';
import { API_BASE_URL } from './config';

// API Service
const api = {
  async getRoute(vehicleId) {
    const response = await fetch(`${API_BASE_URL}/routes/${vehicleId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch route: ${response.statusText}`);
    }
    return response.json();
  },

  async updateStopStatus(stopId, statusUpdate) {
    const response = await fetch(`${API_BASE_URL}/route_stops/${stopId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusUpdate)
    });
    if (!response.ok) {
      throw new Error(`Failed to update stop: ${response.statusText}`);
    }
    return response.json();
  },

  async getProgress(vehicleId) {
    const response = await fetch(`${API_BASE_URL}/routes/${vehicleId}/progress`);
    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.statusText}`);
    }
    return response.json();
  }
};

// Main App
export default function DriverApp() {
  const [vehicleId, setVehicleId] = useState(localStorage.getItem('vehicleId') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [route, setRoute] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!vehicleId.trim()) {
      setError('Please enter a vehicle ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const routeData = await api.getRoute(vehicleId);
      const progressData = await api.getProgress(vehicleId);
      
      setRoute(routeData);
      setProgress(progressData);
      setIsLoggedIn(true);
      localStorage.setItem('vehicleId', vehicleId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRoute(null);
    setProgress(null);
    localStorage.removeItem('vehicleId');
  };

  const refreshRoute = async () => {
    try {
      const routeData = await api.getRoute(vehicleId);
      const progressData = await api.getProgress(vehicleId);
      setRoute(routeData);
      setProgress(progressData);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen 
      vehicleId={vehicleId}
      setVehicleId={setVehicleId}
      handleLogin={handleLogin}
      loading={loading}
      error={error}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        vehicleId={vehicleId}
        driverName={route?.driver_name}
        onLogout={handleLogout}
        onRefresh={refreshRoute}
      />
      
      {progress && <ProgressBar progress={progress} />}
      
      <RouteView 
        route={route}
        onStopUpdate={refreshRoute}
        error={error}
      />
    </div>
  );
}

// Login Screen
function LoginScreen({ vehicleId, setVehicleId, handleLogin, loading, error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Driver Portal</h1>
          <p className="text-gray-600 mt-2">Enter your vehicle ID to view your route</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Vehicle ID (e.g., 9540_0)"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'View My Route'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Header
function Header({ vehicleId, driverName, onLogout, onRefresh }) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Route</h1>
            <p className="text-sm text-gray-600">
              Vehicle: {vehicleId} {driverName && `• ${driverName}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
            >
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Progress Bar
function ProgressBar({ progress }) {
  const percentage = progress.progress_percentage || 0;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Route Progress</span>
          <span className="text-gray-600">
            {progress.completed} of {progress.total_stops} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Route View
function RouteView({ route, onStopUpdate, error }) {
  if (!route) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        Loading route...
      </div>
    );
  }

  const allStops = route.stops || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {allStops.map((stop) => (
          <StopCard
            key={stop.stop_id}
            stop={stop}
            onUpdate={onStopUpdate}
          />
        ))}
      </div>
    </div>
  );
}

// Stop Card
function StopCard({ stop, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const statusConfig = {
    pending: { color: 'gray', icon: Clock, label: 'Pending' },
    in_transit: { color: 'blue', icon: MapPin, label: 'In Transit' },
    completed: { color: 'green', icon: CheckCircle, label: 'Completed' },
    skipped: { color: 'yellow', icon: XCircle, label: 'Skipped' },
    delayed: { color: 'orange', icon: AlertCircle, label: 'Delayed' },
    failed: { color: 'red', icon: XCircle, label: 'Failed' }
  };

  const config = statusConfig[stop.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.updateStopStatus(stop.stop_id, {
        status: newStatus,
        actual_arrival: newStatus === 'completed' ? new Date().toISOString() : null,
        notes: notes || null
      });
      setShowNotes(false);
      setNotes('');
      onUpdate();
    } catch (err) {
      alert(`Failed to update stop: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const colorClasses = {
    gray: 'bg-gray-50 border-gray-300',
    blue: 'bg-blue-50 border-blue-300',
    green: 'bg-green-50 border-green-300',
    yellow: 'bg-yellow-50 border-yellow-300',
    orange: 'bg-orange-50 border-orange-300',
    red: 'bg-red-50 border-red-300'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[config.color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg">#{stop.stop_sequence}</span>
            <h3 className="font-semibold text-lg">{stop.store_name}</h3>
          </div>
          <p className="text-sm text-gray-700">{stop.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
      </div>

      {stop.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={updating}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {updating ? 'Updating...' : 'Complete'}
          </button>
          <button
            onClick={() => handleStatusChange('skipped')}
            disabled={updating}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes..."
          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      )}
    </div>
  );
}
