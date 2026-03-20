'use client';

import { useState, useRef } from 'react';
import { X, Upload, Camera, Signature } from 'lucide-react';

interface PostSwapHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  swap: any;
  hubManagerId: number;
  onHandoverComplete: () => void;
}

export default function PostSwapHandoverModal({
  isOpen,
  onClose,
  swap,
  hubManagerId,
  onHandoverComplete,
}: PostSwapHandoverModalProps) {
  const [formData, setFormData] = useState({
    odometerReading: '',
    fuelLevel: 'full',
    notes: '',
  });
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);
  const [riderSignature, setRiderSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  if (!isOpen || !swap) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
          setVehiclePhotos((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removePhoto = (index: number) => {
    setVehiclePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const startSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsDrawingSignature(true);
      }
    }
  };

  const handleSignatureStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    e.preventDefault();
    
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas?.getBoundingClientRect();

    if (ctx && rect) {
      let x, y;
      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    e.preventDefault();
    
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas?.getBoundingClientRect();

    if (ctx && rect) {
      let x, y;
      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1f2937';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const finishSignature = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    
    const canvas = signatureCanvasRef.current;
    if (canvas && isDrawingSignature) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
      setRiderSignature(canvas.toDataURL());
      setIsDrawingSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!riderSignature) {
      alert('Please capture rider signature');
      return;
    }

    if (vehiclePhotos.length === 0) {
      alert('Please upload at least one vehicle photo');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        action: 'complete-post-swap-handover',
        swapRequestId: swap.id,
        riderId: swap.rider_id,
        hubManagerId,
        newVehicleId: swap.replacement_vehicle_id,
        oldVehicleId: swap.vehicle_id,
        hubId: swap.hub_id,
        vehiclePhotos,
        riderSignature,
        odometerReading: formData.odometerReading || '',
        fuelLevel: formData.fuelLevel,
        notes: formData.notes || '',
      };

      const response = await fetch('/api/swap-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Vehicle handover completed successfully! Old vehicle status updated to "In Maintenance" and new vehicle assigned to rider.');
        onHandoverComplete();
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error completing post-swap handover:', error);
      alert('Failed to complete handover');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-green-900">Post-Swap Vehicle Handover</h2>
            <p className="text-sm text-green-800 mt-1">
              Complete the handover of new vehicle to: {swap.rider_name} ({swap.rider_cee_id})
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-green-200 rounded-lg">
            <X size={24} className="text-green-700" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Swap Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-300 space-y-4">
            <h3 className="font-semibold text-blue-900 text-lg">Swap Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-700 font-medium uppercase">Old Vehicle (In Maintenance)</p>
                <p className="text-sm font-mono font-bold text-blue-900 mt-1">{swap.current_vehicle_number}</p>
                <p className="text-xs text-blue-700">{swap.current_vehicle_type}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium uppercase">New Vehicle (Being Handed Over)</p>
                <p className="text-sm font-mono font-bold text-blue-900 mt-1">{swap.replacement_vehicle_number}</p>
                <p className="text-xs text-blue-700">{swap.replacement_vehicle_type}</p>
              </div>
            </div>
            <div className="border-t-2 border-blue-200 pt-4">
              <p className="text-xs text-blue-700 font-medium uppercase">Rider Information</p>
              <p className="text-sm font-semibold text-blue-900 mt-1">{swap.rider_name}</p>
              <p className="text-xs text-blue-700">CEE ID: {swap.rider_cee_id} | Phone: {swap.rider_phone}</p>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900 block mb-2">
                Odometer Reading (New Vehicle)
              </span>
              <input
                type="text"
                placeholder="e.g., 00,050 KM"
                value={formData.odometerReading}
                onChange={(e) =>
                  setFormData({ ...formData, odometerReading: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900 block mb-2">
                Fuel Level
              </span>
              <select
                value={formData.fuelLevel}
                onChange={(e) =>
                  setFormData({ ...formData, fuelLevel: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="empty">Empty</option>
                <option value="quarter">Quarter</option>
                <option value="half">Half</option>
                <option value="three-quarters">Three-quarters</option>
                <option value="full">Full</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900 block mb-2">
                Notes/Remarks
              </span>
              <textarea
                placeholder="Any special conditions, damage noted, or rider remarks..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              ></textarea>
            </label>
          </div>

          {/* Vehicle Photos */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900 block mb-2">
                New Vehicle Photos ({vehiclePhotos.length}/3)
              </span>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition flex items-center justify-center gap-2 text-green-600 font-medium"
              >
                <Camera size={20} />
                Upload Vehicle Photos (up to 3)
              </button>
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            {/* Photo Preview */}
            {vehiclePhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {vehiclePhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rider Signature */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900 block mb-2">
                Rider Signature
              </span>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={signatureCanvasRef}
                  width={600}
                  height={200}
                  className={`w-full border-b border-slate-200 ${
                    isDrawingSignature ? 'cursor-crosshair bg-slate-50' : 'cursor-pointer bg-white'
                  }`}
                  onMouseDown={handleSignatureStart}
                  onMouseMove={handleSignatureMove}
                  onMouseUp={finishSignature}
                  onMouseLeave={finishSignature}
                  onTouchStart={handleSignatureStart}
                  onTouchMove={handleSignatureMove}
                  onTouchEnd={finishSignature}
                  style={{ display: 'block', width: '100%', height: '200px', touchAction: 'none' }}
                />
                <div className="p-3 flex gap-2 bg-slate-50">
                  {!riderSignature ? (
                    <>
                      <button
                        type="button"
                        onClick={startSignature}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${
                          isDrawingSignature
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        <Signature size={16} />
                        {isDrawingSignature ? 'Drawing... (Release to finish)' : 'Start Drawing'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const canvas = signatureCanvasRef.current;
                          if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.clearRect(0, 0, canvas.width, canvas.height);
                            }
                          }
                          setRiderSignature(null);
                          setIsDrawingSignature(false);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 text-slate-900 rounded text-sm font-medium hover:bg-slate-200 transition"
                      >
                        Clear
                      </button>
                      <span className="flex-1 flex items-center justify-center text-green-600 font-medium text-sm">
                        ✓ Signature captured
                      </span>
                    </>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Important Info */}
          <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded">
            <p className="text-xs font-semibold text-amber-900 mb-2">⚠️ IMPORTANT</p>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>Take clear photos of the NEW vehicle from all angles</li>
              <li>Verify odometer and fuel level on NEW vehicle</li>
              <li>Get rider signature for confirmation</li>
              <li>OLD vehicle will automatically be marked as "In Maintenance"</li>
              <li>NEW vehicle will be assigned to the rider</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Completing...' : 'Complete Handover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
