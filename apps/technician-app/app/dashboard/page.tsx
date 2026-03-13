'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, Wrench, AlertCircle, Zap, CheckCircle } from 'lucide-react';

export default function TechnicianDashboard() {
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
            <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage vehicle maintenance and repairs</p>
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
              <p className="text-sm font-medium text-gray-900">Technician</p>
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
                <p className="text-sm text-gray-600 font-medium">Open Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">7</p>
              </div>
              <Wrench className="w-12 h-12 text-orange-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">34</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Vehicles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">42</p>
              </div>
              <Zap className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Critical</p>
                <p className="text-3xl font-bold text-red-600 mt-2">2</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-100" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Tickets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Open Service Tickets</h3>
                <p className="text-sm text-gray-600 mt-1">7 pending repairs</p>
              </div>
              <div className="divide-y">
                <div className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Vehicle #RJ14AB2024</p>
                      <p className="text-sm text-gray-600 mt-1">Battery Not Charging</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Urgent</span>
                  </div>
                </div>
                <div className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Vehicle #RJ14CD5021</p>
                      <p className="text-sm text-gray-600 mt-1">Motor Service</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">High</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parts Inventory */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Parts Inventory</h3>
                <p className="text-sm text-gray-600 mt-1">Monitor spare parts stock</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Battery Pack</p>
                    <p className="text-sm text-gray-600">12 in stock</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Motor Controller</p>
                    <p className="text-sm text-gray-600">5 in stock</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Brake Pads</p>
                    <p className="text-sm text-red-600 font-medium">2 in stock</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-white text-orange-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
                  Create Ticket
                </button>
                <button className="w-full bg-white text-orange-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
                  Update Status
                </button>
              </div>
            </div>

            {/* Critical Issues */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Critical Issues</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Battery Failure</p>
                    <p className="text-xs text-red-600">Vehicle #RJ14AB2024</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Low Brake Pads</p>
                    <p className="text-xs text-red-600">Emergency supply needed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Performance</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-2">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">82%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-2">Avg Resolution</p>
                  <p className="text-2xl font-bold text-gray-900">4.2h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
