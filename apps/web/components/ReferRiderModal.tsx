'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ReferRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: {
    user_id: string;
    cee_id: string;
    full_name: string;
  };
  onSuccess: () => void;
}

export default function ReferRiderModal({
  isOpen,
  onClose,
  rider,
  onSuccess,
}: ReferRiderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    referredName: '',
    referredPhone: '',
    preferredLocation: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (
        !formData.referredName ||
        !formData.referredPhone ||
        !formData.preferredLocation
      ) {
        throw new Error('Please fill in all required fields');
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.referredPhone)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerCeeId: rider.cee_id,
          referrerName: rider.full_name,
          referredName: formData.referredName,
          referredPhone: formData.referredPhone,
          preferredLocation: formData.preferredLocation,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit referral');
      }

      setFormData({
        referredName: '',
        referredPhone: '',
        preferredLocation: '',
        notes: '',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Refer a Rider</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referred Person Name *
            </label>
            <input
              type="text"
              value={formData.referredName}
              onChange={(e) =>
                setFormData({ ...formData, referredName: e.target.value })
              }
              placeholder="Full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (10 digits) *
            </label>
            <input
              type="tel"
              value={formData.referredPhone}
              onChange={(e) =>
                setFormData({ ...formData, referredPhone: e.target.value })
              }
              placeholder="1234567890"
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Location *
            </label>
            <input
              type="text"
              value={formData.preferredLocation}
              onChange={(e) =>
                setFormData({ ...formData, preferredLocation: e.target.value })
              }
              placeholder="City/Area"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional information about the referral"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
