'use client';

import { useState, useEffect } from 'react';
import { Lock, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import RiderPasswordManager from '@/components/RiderPasswordManager';

interface Rider {
  id: number;
  cee_id: string;
  full_name: string;
  email: string;
  status: string;
  has_password?: boolean;
}

export default function RiderPasswordSetupPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'has_password' | 'no_password'>('all');

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/riders');
      const data = await response.json();
      setRiders(data);
    } catch (error) {
      console.error('Error fetching riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (rider: Rider) => {
    setSelectedRider(rider);
    setIsModalOpen(true);
  };

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.cee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'has_password') return matchesSearch && rider.has_password;
    if (filterStatus === 'no_password') return matchesSearch && !rider.has_password;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading riders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Lock className="w-8 h-8 text-indigo-600" />
            Rider Password Setup
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and set passwords for riders to enable email/password login
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Riders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{riders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">With Password</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {riders.filter((r) => r.has_password).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Without Password</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {riders.filter((r) => !r.has_password).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by CEE ID, name, or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as 'all' | 'has_password' | 'no_password')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Riders</option>
                <option value="has_password">With Password</option>
                <option value="no_password">Without Password</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchRiders}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Riders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  CEE ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Password
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRiders.length > 0 ? (
                filteredRiders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {rider.cee_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{rider.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {rider.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rider.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {rider.has_password ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Set
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => openPasswordModal(rider)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-medium text-xs"
                      >
                        {rider.has_password ? 'Reset' : 'Set'} Password
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No riders found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Manager Modal */}
      <RiderPasswordManager
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRider(null);
          fetchRiders(); // Refresh list after setting password
        }}
        riderEmail={selectedRider?.email}
        riderName={selectedRider?.full_name}
      />
    </div>
  );
}
