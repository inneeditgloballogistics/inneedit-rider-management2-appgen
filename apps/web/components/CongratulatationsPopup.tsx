'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle, MapPin, Phone, Building2 } from 'lucide-react';

interface CongratulatationsPopupProps {
  isOpen: boolean;
  riderData: {
    fullName: string;
    ceeId: string;
    client: string;
    vehicleNumber?: string;
    hubName?: string;
    hubLocation?: string;
    managerName?: string;
    managerPhone?: string;
  };
  onClose: () => void;
}

export default function CongratulatationsPopup({ isOpen, riderData, onClose }: CongratulatationsPopupProps) {
  const [canClose, setCanClose] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setCanClose(false);
      const timer = setTimeout(() => setCanClose(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    router.push('/rider-login');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 pt-8 pb-6 text-center relative">
          <button
            onClick={canClose ? handleClose : undefined}
            className={`absolute top-4 right-4 p-2 rounded-full hover:bg-green-600 transition-all ${
              canClose ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            }`}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Congratulations!</h1>
          <p className="text-green-50 text-sm leading-relaxed">
            Welcome to the inneedit team for your growth and success
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-900 font-semibold text-center text-sm">
              You have been successfully registered and assigned to your hub
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Client */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Client</p>
              <p className="text-lg font-bold text-blue-900 capitalize">{riderData.client}</p>
            </div>

            {/* CEE ID */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">Your CEE ID</p>
              <p className="text-xl font-mono font-bold text-purple-900 tracking-wider">{riderData.ceeId}</p>
              <p className="text-xs text-purple-600 mt-2">Use this to login to your rider app</p>
            </div>

            {/* Vehicle Assigned */}
            {riderData.vehicleNumber && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Vehicle Assigned</p>
                <p className="text-lg font-bold text-orange-900 font-mono">{riderData.vehicleNumber}</p>
              </div>
            )}

            {/* Hub Information */}
            {riderData.hubName && (
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100 space-y-3">
                <div>
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-1">Hub Location</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-indigo-900">{riderData.hubName}</p>
                      <p className="text-sm text-indigo-700">{riderData.hubLocation}</p>
                    </div>
                  </div>
                </div>

                {/* Hub Manager Contact */}
                {riderData.managerName && (
                  <div className="pt-3 border-t border-indigo-200">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-2">Hub Manager</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <p className="font-semibold text-indigo-900 text-sm">{riderData.managerName}</p>
                      </div>
                      {riderData.managerPhone && (
                        <a
                          href={`tel:${riderData.managerPhone}`}
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">{riderData.managerPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Next Steps</p>
            <ol className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="font-bold text-slate-900 w-5">1.</span>
                <span>Visit your assigned hub to collect the vehicle</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-slate-900 w-5">2.</span>
                <span>Contact the hub manager for vehicle formalities</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-slate-900 w-5">3.</span>
                <span>Download the rider app and login with your CEE ID</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-slate-900 w-5">4.</span>
                <span>Start delivering and earn with inneedit</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <button
            onClick={handleClose}
            disabled={!canClose}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              canClose
                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canClose ? 'Got it, lets go! 🚀' : 'Loading...'}
          </button>
          {!canClose && (
            <p className="text-xs text-gray-500 text-center mt-2">Popup will close in a moment...</p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(100px);
          }
          50% {
            opacity: 1;
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
}
