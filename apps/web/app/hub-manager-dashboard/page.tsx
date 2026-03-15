'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MapPin, Phone, Users, CheckCircle, Clock, Camera, FileText, ArrowLeft, AlertCircle, Upload } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_id: number;
  is_read: boolean;
  created_at: string;
}

interface RiderOnboarding {
  id: number;
  cee_id: string;
  full_name: string;
  phone: string;
  client: string;
  assigned_hub_id: number;
  assigned_vehicle_id: number | null;
  driving_license_url?: string;
  aadhar_url?: string;
  status: string;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  assigned_rider_id?: string;
}

export default function HubManagerDashboard() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [riders, setRiders] = useState<RiderOnboarding[]>([]);
  const [selectedRider, setSelectedRider] = useState<RiderOnboarding | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
  const [riderPhotos, setRiderPhotos] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHandoverForm, setShowHandoverForm] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch notifications
      const notificationsRes = await fetch('/api/notifications?isRead=false');
      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        const onboardingNotifications = data.notifications.filter(
          (n: Notification) => n.type === 'new_rider_onboarding'
        );
        setNotifications(onboardingNotifications);
      }

      // Fetch all riders (for hub manager's hub)
      const ridersRes = await fetch('/api/riders');
      if (ridersRes.ok) {
        const data = await ridersRes.json();
        setRiders(data.riders || []);
      }

      // Fetch vehicles
      const vehiclesRes = await fetch('/api/vehicles');
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId, isRead: true })
      });
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getRiderById = (riderId: number) => {
    return riders.find(r => r.id === riderId);
  };

  const handleVehiclePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVehiclePhotos(Array.from(e.target.files));
    }
  };

  const handleRiderPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setRiderPhotos(Array.from(e.target.files));
    }
  };

  const handleSignatureCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignature(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCompleteHandover = async () => {
    if (!selectedRider) return;

    setIsProcessing(true);
    try {
      // Upload all photos
      const uploadedUrls = [];

      // Upload vehicle photos
      for (const photo of vehiclePhotos) {
        const formData = new FormData();
        formData.append('file', photo);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) uploadedUrls.push(uploadData.url);
      }

      // Upload rider photos
      for (const photo of riderPhotos) {
        const formData = new FormData();
        formData.append('file', photo);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) uploadedUrls.push(uploadData.url);
      }

      // Upload signature
      if (signature) {
        const signatureBlob = await fetch(signature).then(r => r.blob());
        const formData = new FormData();
        formData.append('file', signatureBlob, 'signature.png');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) uploadedUrls.push(uploadData.url);
      }

      // Create notification for rider
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'vehicle_handover_complete',
          title: 'Vehicle Handed Over Successfully',
          message: `Your vehicle has been handed over. You are now ready to start deliveries. Welcome to inneedit!`,
          related_id: selectedRider.id
        })
      });

      // Update rider status
      await fetch('/api/riders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRider.id,
          status: 'active'
        })
      });

      alert('Vehicle handover completed successfully!');
      setShowHandoverForm(false);
      setSelectedRider(null);
      setVehiclePhotos([]);
      setRiderPhotos([]);
      setSignature(null);
      fetchData();
    } catch (err) {
      console.error('Error completing handover:', err);
      alert('Failed to complete handover. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hub dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hub Manager Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage rider onboarding and vehicle handovers</p>
            </div>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {selectedRider ? (
          // Rider Details View
          <div className="space-y-6">
            <button
              onClick={() => setSelectedRider(null)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Rider Information */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRider.full_name}</h2>
                  <p className="text-gray-600 mt-1">CEE ID: <span className="font-mono font-semibold">{selectedRider.cee_id}</span></p>
                  <p className="text-gray-600">Client: <span className="font-semibold">{selectedRider.client}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href={`tel:${selectedRider.phone}`} className="text-lg font-semibold text-indigo-600 hover:text-indigo-700">
                      {selectedRider.phone}
                    </a>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 mt-1">
                      Pending Handover
                    </span>
                  </div>
                </div>

                {/* Documents */}
                {(selectedRider.driving_license_url || selectedRider.aadhar_url) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRider.driving_license_url && (
                        <a
                          href={selectedRider.driving_license_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
                        >
                          <FileText className="w-6 h-6 text-blue-600 mb-2" />
                          <p className="font-semibold text-gray-900 text-sm">Driving License</p>
                        </a>
                      )}
                      {selectedRider.aadhar_url && (
                        <a
                          href={selectedRider.aadhar_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition"
                        >
                          <FileText className="w-6 h-6 text-green-600 mb-2" />
                          <p className="font-semibold text-gray-900 text-sm">Aadhar Card</p>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Handover Form */}
                {showHandoverForm && (
                  <div className="border-t pt-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">Vehicle Handover Checklist</h3>

                    {/* Vehicle Photos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Camera className="w-4 h-4 inline mr-2" />
                        Vehicle Photos (All 4 Sides)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleVehiclePhotoChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-600 mt-2">Upload front, back, left side, right side photos</p>
                      {vehiclePhotos.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">{vehiclePhotos.length} photo(s) selected</p>
                      )}
                    </div>

                    {/* Rider Photos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Camera className="w-4 h-4 inline mr-2" />
                        Rider & Vehicle Photos (Handover Moment)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleRiderPhotoChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-600 mt-2">Photos of rider with vehicle, rider's ID verification</p>
                      {riderPhotos.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">{riderPhotos.length} photo(s) selected</p>
                      )}
                    </div>

                    {/* Signature */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Rider's Signature
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureCapture}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-600 mt-2">Upload a clear photo or document of rider's signature</p>
                      {signature && <p className="text-sm text-green-600 mt-2">Signature captured</p>}
                    </div>

                    {/* Checklist Items */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-blue-900 text-sm">Before completing handover, ensure:</p>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>✓ Vehicle condition checked and photos taken</li>
                        <li>✓ All vehicle documents verified</li>
                        <li>✓ Rider has signed handover form</li>
                        <li>✓ Rider's phone number verified</li>
                        <li>✓ EV charging instructions provided (if applicable)</li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleCompleteHandover}
                      disabled={isProcessing || vehiclePhotos.length === 0 || riderPhotos.length === 0 || !signature}
                      className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                    >
                      {isProcessing ? 'Processing...' : 'Complete Handover & Approve Rider'}
                    </button>
                  </div>
                )}

                {!showHandoverForm && (
                  <button
                    onClick={() => setShowHandoverForm(true)}
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Start Vehicle Handover
                  </button>
                )}
              </div>

              {/* Vehicle Assignment */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Vehicle Assignment</h3>
                {selectedRider.assigned_vehicle_id ? (
                  <>
                    {vehicles.find(v => v.id === selectedRider.assigned_vehicle_id) && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <p className="text-sm text-indigo-600 font-medium">Assigned Vehicle</p>
                        <p className="text-2xl font-bold text-indigo-900 mt-2 font-mono">
                          {vehicles.find(v => v.id === selectedRider.assigned_vehicle_id)?.vehicle_number}
                        </p>
                        <p className="text-sm text-indigo-700 mt-1">
                          {vehicles.find(v => v.id === selectedRider.assigned_vehicle_id)?.vehicle_type}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600">No vehicle assigned yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Notifications & Riders List
          <div className="space-y-6">
            {/* Notifications Section */}
            {notifications.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">New Rider Notifications</h2>
                <div className="grid grid-cols-1 gap-4">
                  {notifications.map((notification) => {
                    const rider = getRiderById(notification.related_id);
                    if (!rider) return null;

                    return (
                      <div key={notification.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <h3 className="font-bold text-gray-900">{notification.title}</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">{notification.message}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  handleMarkNotificationRead(notification.id);
                                  setSelectedRider(rider);
                                }}
                                className="px-4 py-2 bg-yellow-100 text-yellow-900 font-semibold rounded-lg hover:bg-yellow-200 transition-all text-sm"
                              >
                                View Rider Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Riders Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Assigned Riders
                </h2>
                <span className="bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full text-sm font-semibold">
                  {riders.length} total
                </span>
              </div>

              {riders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No riders assigned to your hub yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {riders.map((rider) => (
                    <div
                      key={rider.id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border border-gray-200"
                      onClick={() => setSelectedRider(rider)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{rider.full_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">CEE ID: <span className="font-mono font-semibold">{rider.cee_id}</span></p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {rider.phone}
                            </span>
                            <span>{rider.client}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {rider.assigned_vehicle_id ? (
                            <span className="flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                              <CheckCircle className="w-4 h-4" />
                              Vehicle Assigned
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full">
                              No Vehicle
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            rider.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rider.status === 'active' ? 'Active' : 'Pending Handover'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
