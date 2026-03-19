'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Wrench, Phone, User, MapPin, Clock, CheckCircle, X, Truck } from 'lucide-react';
import PartsUsageRecorder from './PartsUsageRecorder';

interface Ticket {
  id: number;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  rider_name?: string;
  rider_cee_id?: string;
  rider_phone?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  created_at: string;
}

export default function TechnicianTickets({ technicianId, hubId }: any) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [showSwapRequest, setShowSwapRequest] = useState(false);
  const [swapReason, setSwapReason] = useState('');
  const [swapNotes, setSwapNotes] = useState('');
  const [submittingSwapRequest, setSubmittingSwapRequest] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/service-tickets?action=technician&technicianId=${technicianId}`);
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

  const handleStartRepair = async (ticketId: number) => {
    try {
      const response = await fetch('/api/service-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: 'In Progress'
        })
      });

      if (response.ok) {
        alert('Ticket status updated!');
        fetchTickets();
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;

    setSubmittingUpdate(true);
    try {
      const response = await fetch('/api/service-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: 'Resolved',
          resolution_notes: resolutionNotes
        })
      });

      if (response.ok) {
        alert('Ticket resolved successfully!');
        setSelectedTicket(null);
        setResolutionNotes('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('Failed to resolve ticket');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleRequestSwap = async () => {
    if (!selectedTicket || !swapReason.trim()) {
      alert('Please provide a reason for the swap');
      return;
    }

    setSubmittingSwapRequest(true);
    try {
      const response = await fetch('/api/swap-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-swap',
          ticketId: selectedTicket.id,
          technicianId,
          issueReason: swapReason,
          notes: swapNotes
        })
      });

      if (response.ok) {
        alert('Swap request submitted! Hub manager will review shortly.');
        setShowSwapRequest(false);
        setSwapReason('');
        setSwapNotes('');
        setSelectedTicket(null);
        fetchTickets();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error requesting swap:', error);
      alert('Failed to request swap');
    } finally {
      setSubmittingSwapRequest(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned':
        return 'bg-amber-100 text-amber-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Resolved':
        return 'bg-green-100 text-green-700';
      case 'Closed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-200 text-red-800';
      case 'High':
        return 'bg-orange-200 text-orange-800';
      case 'Medium':
        return 'bg-amber-200 text-amber-800';
      case 'Low':
        return 'bg-green-200 text-green-800';
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  const assignedTickets = tickets.filter(t => t.status === 'Assigned');
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Service Tickets</h2>
        <p className="text-sm text-gray-600 mt-1">Manage assigned tickets and complete repairs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium">Assigned</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{assignedTickets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{inProgressTickets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium">Resolved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{resolvedTickets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{tickets.length}</p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No tickets assigned yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {ticket.issue_description}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ticket #{ticket.ticket_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Rider</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.rider_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">CEE ID</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{ticket.rider_cee_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.rider_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Vehicle</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{ticket.vehicle_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Raised</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {ticket.status === 'Assigned' && (
                    <button
                      onClick={() => handleStartRepair(ticket.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Wrench size={16} />
                      Start Repair
                    </button>
                  )}
                  {ticket.status === 'In Progress' && (
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicket && selectedTicket.status === 'In Progress' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mark Ticket as Resolved</h3>
                <p className="text-xs text-gray-500 mt-1">Ticket #{selectedTicket.ticket_number}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Issue Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">Issue</p>
                <p className="text-sm text-gray-900">{selectedTicket.issue_description}</p>
              </div>

              {/* Rider Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Rider Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="text-gray-900">{selectedTicket.rider_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">CEE ID:</span>
                    <span className="font-mono text-gray-900">{selectedTicket.rider_cee_id || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-900">{selectedTicket.rider_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-green-600" />
                  Vehicle Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Vehicle Number:</span>
                    <span className="font-mono text-gray-900">{selectedTicket.vehicle_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Type:</span>
                    <span className="text-gray-900">{selectedTicket.vehicle_type || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Parts Usage Recorder */}
              <div className="border-t border-gray-200 pt-6">
                <PartsUsageRecorder 
                  ticketId={selectedTicket.id}
                  hubId={hubId}
                  onPartUsageRecorded={fetchTickets}
                />
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe what repairs were done and the current condition of the vehicle..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  rows={5}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSwapRequest(true);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2"
                >
                  <Truck size={16} />
                  Request Swap
                </button>
                <button
                  onClick={handleResolveTicket}
                  disabled={!resolutionNotes.trim() || submittingUpdate}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  {submittingUpdate ? 'Resolving...' : 'Mark as Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {selectedTicket && showSwapRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Request Vehicle Swap</h3>
                <p className="text-xs text-gray-500 mt-1">Ticket #{selectedTicket.ticket_number}</p>
              </div>
              <button
                onClick={() => {
                  setShowSwapRequest(false);
                  setSwapReason('');
                  setSwapNotes('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Issue Details */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-xs font-medium text-orange-600 mb-2">ISSUE</p>
                <p className="text-sm text-gray-900">{selectedTicket.issue_description}</p>
              </div>

              {/* Swap Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Why does this vehicle need to be swapped? *
                </label>
                <select
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                >
                  <option value="">-- Select a reason --</option>
                  <option value="Issue requires 1-2 days to resolve">Issue requires 1-2 days to repair</option>
                  <option value="Parts need to be ordered">Parts need to be ordered</option>
                  <option value="Complex mechanical issue">Complex mechanical issue</option>
                  <option value="Engine problems">Engine problems</option>
                  <option value="Suspension issues">Suspension issues</option>
                  <option value="Electrical problems">Electrical problems</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={swapNotes}
                  onChange={(e) => setSwapNotes(e.target.value)}
                  placeholder="Provide more context about the issue and estimated repair time..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 resize-none"
                  rows={4}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-600 mb-2">HOW THIS WORKS</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Hub manager will review your swap request</li>
                  <li>Manager will select a replacement vehicle from available fleet</li>
                  <li>Rider will be notified to collect the replacement vehicle</li>
                  <li>Current vehicle will be marked for repair</li>
                  <li>Repair cost will be deducted from rider's payout</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSwapRequest(false);
                    setSwapReason('');
                    setSwapNotes('');
                  }}
                  disabled={submittingSwapRequest}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestSwap}
                  disabled={!swapReason.trim() || submittingSwapRequest}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Truck size={16} />
                  {submittingSwapRequest ? 'Submitting...' : 'Submit Swap Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
