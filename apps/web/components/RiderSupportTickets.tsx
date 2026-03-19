'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, MapPin, ChevronDown, X, Send, Clock, CheckCircle } from 'lucide-react';

interface Ticket {
  id: number;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  assigned_hub_id: number;
  hub_name?: string;
  hub_code?: string;
  vehicle_number?: string;
  technician_name?: string;
  created_at: string;
}

interface Hub {
  id: number;
  hub_name: string;
  hub_code: string;
  location: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

const ISSUE_CATEGORIES = [
  'Brake Problem',
  'Battery Issue',
  'Motor Issue',
  'Tire Issue',
  'Charger Issue',
  'Wheel Alignment',
  'Suspension Problem',
  'Electronic Fault',
  'Other'
];

export default function RiderSupportTickets({ riderId, riderLatitude, riderLongitude }: any) {
  const [showRaiseTicket, setShowRaiseTicket] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedIssue, setSelectedIssue] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [nearestHub, setNearestHub] = useState<Hub | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchHubs();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/service-tickets?action=rider&ceeId=${riderId}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHubs = async () => {
    try {
      const response = await fetch('/api/hubs');
      if (response.ok) {
        const data = await response.json();
        setHubs(data);
        
        // Find nearest hub if location is available
        if (riderLatitude && riderLongitude) {
          const nearestH = findNearestHub(data, riderLatitude, riderLongitude);
          setNearestHub(nearestH);
          setSelectedHub(nearestH);
        }
      }
    } catch (error) {
      console.error('Error fetching hubs:', error);
    }
  };

  const findNearestHub = (hubsList: Hub[], lat: number, lng: number) => {
    if (!hubsList.length) return null;

    const distances = hubsList.map(hub => ({
      ...hub,
      distance: calculateDistance(lat, lng, hub.latitude || 0, hub.longitude || 0)
    }));

    return distances.sort((a, b) => a.distance - b.distance)[0];
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !selectedHub) {
      alert('Please select an issue and hub');
      return;
    }

    if (selectedIssue === 'Other' && !issueDescription) {
      alert('Please describe the issue');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/service-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ceeId: riderId,
          hub_id: selectedHub.id,
          issueCategory: selectedIssue,
          issueDescription: selectedIssue === 'Other' ? issueDescription : '',
          priority: 'Medium'
        })
      });

      if (response.ok) {
        alert('Ticket raised successfully!');
        setShowRaiseTicket(false);
        setSelectedIssue('');
        setIssueDescription('');
        fetchTickets();
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || response.statusText || 'Failed to raise ticket';
        console.error('Error raising ticket:', errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error raising ticket:', error);
      alert('Failed to raise ticket: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const activeTickets = tickets.filter(t => !['Completed', 'Closed'].includes(t.status));
  const historyTickets = tickets.filter(t => ['Completed', 'Closed'].includes(t.status));
  const displayTickets = selectedTab === 'active' ? activeTickets : historyTickets;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-700';
      case 'Assigned':
        return 'bg-amber-100 text-amber-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Closed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'Completed':
      case 'Closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-600 mt-1">Raise and track vehicle issues</p>
        </div>
        <button
          onClick={() => setShowRaiseTicket(true)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          + Raise Ticket
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex-1 px-6 py-4 font-medium text-center transition ${selectedTab === 'active' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Active Tickets ({activeTickets.length})
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`flex-1 px-6 py-4 font-medium text-center transition ${selectedTab === 'history' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            History ({historyTickets.length})
          </button>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tickets...</p>
          </div>
        ) : displayTickets.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {selectedTab === 'active'
                ? 'No active tickets. Your vehicle is running smoothly!'
                : 'No ticket history yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayTickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {ticket.issue_description}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ticket #{ticket.ticket_number}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Hub</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.hub_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Vehicle</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.vehicle_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Priority</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.priority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Technician</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.technician_name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showRaiseTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Raise Support Ticket</h3>
              <button
                onClick={() => setShowRaiseTicket(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRaiseTicket} className="p-6 space-y-4">
              {/* Hub Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hub
                </label>
                {nearestHub && (
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <MapPin size={14} /> Nearest: {nearestHub.hub_name}
                  </p>
                )}
                <div className="relative">
                  <select
                    value={selectedHub?.id || ''}
                    onChange={(e) => {
                      const hub = hubs.find(h => h.id === parseInt(e.target.value));
                      setSelectedHub(hub || null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none"
                  >
                    <option value="">Choose a hub...</option>
                    {hubs.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.hub_name} - {hub.city}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                </div>
              </div>

              {/* Issue Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Category
                </label>
                <div className="relative">
                  <select
                    value={selectedIssue}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none"
                  >
                    <option value="">Select an issue...</option>
                    {ISSUE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                </div>
              </div>

              {/* Description (shows only for "Other") */}
              {selectedIssue === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe the Problem
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Please describe the issue in detail..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                    rows={4}
                  ></textarea>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRaiseTicket(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedIssue || !selectedHub}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
