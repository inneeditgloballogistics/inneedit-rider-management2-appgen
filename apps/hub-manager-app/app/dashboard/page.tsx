'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, Users, Truck, AlertCircle, TrendingUp } from 'lucide-react';

export default function HubManagerDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // Add logout logic here
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hub Manager Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your hub operations</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition" 
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Hub Manager</p>
              <p className="text-xs text-gray-500">inneedit Global</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Riders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              </div>
              <Users className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Vehicles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">18</p>
              </div>
              <Truck className="w-12 h-12 text-green-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">142</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Alerts</p>
                <p className="text-3xl font-bold text-red-600 mt-2">3</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-100" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rider Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Rider Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your hub riders</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                    <p className="font-medium text-gray-900">View All Riders</p>
                    <p className="text-xs text-gray-500 mt-1">24 active</p>
                  </button>
                  <button className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                    <p className="font-medium text-gray-900">Track Orders</p>
                    <p className="text-xs text-gray-500 mt-1">142 today</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Vehicle Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Fleet</h3>
                <p className="text-sm text-gray-600 mt-1">Monitor vehicle status and maintenance</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition">
                    <p className="font-medium text-gray-900\">Active Vehicles</p>\n                    <p className=\"text-xs text-gray-500 mt-1\">18 operational</p>
                  </button>
                  <button className=\"p-4 border border-green-200 rounded-lg hover:bg-green-50 transition\">
                    <p className=\"font-medium text-gray-900\">Schedule Service</p>
                    <p className=\"text-xs text-gray-500 mt-1\">2 due soon</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className=\"space-y-6\">
            {/* Quick Actions */}
            <div className=\"bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white\">
              <h3 className=\"text-lg font-semibold mb-4\">Quick Actions</h3>
              <div className=\"space-y-3\">
                <button className=\"w-full bg-white text-blue-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition\">
                  Add New Rider
                </button>
                <button className=\"w-full bg-white text-blue-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition\">
                  Report Issue
                </button>
              </div>
            </div>

            {/* Alerts */}
            <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden\">
              <div className=\"p-6 border-b border-gray-200\">
                <h3 className=\"font-semibold text-gray-900\">Active Alerts</h3>
              </div>
              <div className=\"p-4 space-y-3\">
                <div className=\"flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200\">
                  <AlertCircle className=\"w-5 h-5 text-red-600 flex-shrink-0 mt-0.5\" />
                  <div>
                    <p className=\"text-sm font-medium text-red-900\">Vehicle Maintenance Due</p>
                    <p className=\"text-xs text-red-600\">Vehicle #RJ14AB2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
