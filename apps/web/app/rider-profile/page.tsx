'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Briefcase, Wallet, Car, Award, AlertCircle, Clock, User, Calendar } from 'lucide-react';

interface RiderProfile {
  id: number;
  user_id: string;
  cee_id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  client?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  driving_license_url?: string;
  aadhar_number?: string;
  aadhar_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  vehicle_type?: string;
  assigned_hub_id?: number;
  status?: string;
  is_leader?: boolean;
  leader_discount_percentage?: number;
  vehicle_ownership?: string;
  ev_daily_rent?: number;
  ev_type?: string;
  join_date?: string;
  created_at?: string;
}

interface HubInfo {
  hub_name: string;
  location: string;
  city: string;
}

export default function RiderProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/rider-auth', {
        method: 'GET',
        credentials: 'include',
      });

      if (!authResponse.ok) {
        router.push('/rider-login');
        return;
      }

      const authData = await authResponse.json();
      const rider = authData.rider;

      // Fetch complete rider profile
      const profileResponse = await fetch(`/api/riders?user_id=${rider.user_id}`);
      if (!profileResponse.ok) {
        setError('Failed to fetch profile');
        setLoading(false);
        return;
      }

      const profileData = await profileResponse.json();
      if (profileData.riders && profileData.riders.length > 0) {
        const riderData = profileData.riders[0];
        setProfile(riderData);

        // Fetch hub info if assigned
        if (riderData.assigned_hub_id) {
          try {
            const hubResponse = await fetch(`/api/hubs?id=${riderData.assigned_hub_id}`);
            if (hubResponse.ok) {
              const hubData = await hubResponse.json();
              if (hubData.hubs && hubData.hubs.length > 0) {
                setHubInfo(hubData.hubs[0]);
              }
            }
          } catch (err) {
            console.error('Error fetching hub info:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return 'Not provided';
    const length = accountNumber.length;
    if (length <= 4) return accountNumber;
    return '*'.repeat(length - 4) + accountNumber.slice(-4);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">My Profile</h1>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">My Profile</h1>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error || 'Failed to load profile'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-600 mt-1">CEE ID: {profile.cee_id}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{profile.full_name}</h2>
                <p className="text-gray-600 mt-1">{profile.client || 'Rider'}</p>
                {profile.is_leader && (
                  <div className="flex items-center gap-2 mt-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-600">Team Leader</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded-full" style={{
                backgroundColor: profile.status === 'active' ? '#d1fae5' : '#fee2e2',
              }}>
                <span style={{
                  color: profile.status === 'active' ? '#047857' : '#dc2626',
                }} className="text-sm font-semibold capitalize">
                  {profile.status || 'Active'}
                </span>
              </div>
              {profile.join_date && (
                <p className="text-sm text-gray-600 mt-3">
                  Joined: {formatDate(profile.join_date)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Personal Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{profile.email || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{formatDate(profile.date_of_birth)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <p className="text-gray-900 mt-1">{profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                <p className="text-gray-900 text-sm mt-1">{profile.emergency_contact_name || 'Not provided'}</p>
                {profile.emergency_contact_phone && (
                  <p className="text-gray-600 text-sm">{profile.emergency_contact_phone}</p>
                )}
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Address</label>
                <p className="text-gray-900 mt-1">{profile.address || 'Not provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="text-gray-900 mt-1">{profile.city || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <p className="text-gray-900 mt-1">{profile.state || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <p className="text-gray-900 mt-1">{profile.pincode || 'Not provided'}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Document Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Documents
            </h3>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">Driving License</label>
                <p className="text-gray-900 text-sm">{profile.driving_license_number || 'Not provided'}</p>
                {profile.driving_license_expiry && (
                  <p className="text-gray-600 text-sm mt-1">
                    Expires: {formatDate(profile.driving_license_expiry)}
                  </p>
                )}
                {profile.driving_license_url && (
                  <a
                    href={profile.driving_license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm mt-2 block"
                  >
                    View Document →
                  </a>
                )}
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar</label>
                <p className="text-gray-900 text-sm">{profile.aadhar_number ? profile.aadhar_number.slice(-4).padStart(profile.aadhar_number.length, '*') : 'Not provided'}</p>
                {profile.aadhar_url && (
                  <a
                    href={profile.aadhar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm mt-2 block"
                  >
                    View Document →
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Banking Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              Banking Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <p className="text-gray-900 mt-1">{profile.bank_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <p className="text-gray-900 mt-1 font-mono text-sm">{maskAccountNumber(profile.account_number)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                <p className="text-gray-900 mt-1 font-mono">{profile.ifsc_code || 'Not provided'}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Vehicle & Hub Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-600" />
              Vehicle & Hub
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <p className="text-gray-900 mt-1">{profile.vehicle_type || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Ownership</label>
                <p className="text-gray-900 mt-1 capitalize">
                  {profile.vehicle_ownership === 'company_ev' ? 'Company EV' : 
                   profile.vehicle_ownership === 'own_vehicle' ? 'Own Vehicle' : 
                   profile.vehicle_ownership || 'Not provided'}
                </p>
              </div>
              {profile.vehicle_ownership === 'company_ev' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">EV Type</label>
                    <p className="text-gray-900 mt-1 capitalize">
                      {profile.ev_type === 'fixed_battery' ? 'Fixed Battery' : 
                       profile.ev_type === 'swappable_battery' ? 'Swappable Battery' :
                       profile.ev_type || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Daily Rent</label>
                    <p className="text-gray-900 mt-1">₹{profile.ev_daily_rent || 'Not provided'}</p>
                  </div>
                </>
              )}
              {hubInfo && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Assigned Hub</label>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="font-semibold text-gray-900">{hubInfo.hub_name}</p>
                    <p className="text-sm text-gray-600">{hubInfo.location}</p>
                    <p className="text-sm text-gray-600">{hubInfo.city}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Leadership Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Leadership Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Team Leader</label>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.is_leader 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile.is_leader ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              {profile.is_leader && profile.leader_discount_percentage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leader Discount</label>
                  <p className="text-gray-900 mt-1">{profile.leader_discount_percentage}%</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Additional Info */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Account Timeline
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Profile Created:</span>
              <span className="font-medium text-gray-900">{formatDate(profile.created_at)}</span>
            </div>
            {profile.join_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Join Date:</span>
                <span className="font-medium text-gray-900">{formatDate(profile.join_date)}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
