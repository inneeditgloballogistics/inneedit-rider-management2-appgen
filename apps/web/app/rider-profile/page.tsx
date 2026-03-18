'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Wallet, Car, Award, AlertCircle, Clock, User, Calendar, CheckCircle, Trophy } from 'lucide-react';

interface RiderProfile {
  id: number;
  cee_id: string;
  full_name: string;
  phone: string;
  email?: string;
  client?: string;
  status?: string;
  is_leader?: boolean;
  leader_discount_percentage?: number;
  join_date?: string;
  created_at?: string;
  assigned_hub_id?: number;
  store_id?: number;
  vehicle_ownership?: string;
  ev_type?: string;
  ev_daily_rent?: number;
}

interface HubInfo {
  hub_name: string;
  location: string;
  city: string;
}

interface StoreInfo {
  store_name: string;
  location: string;
  city: string;
  store_manager_name?: string;
  store_manager_phone?: string;
}

export default function RiderProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'registration'>('profile');

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
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

        if (riderData.assigned_hub_id) {
          try {
            const hubResponse = await fetch(`/api/hubs`);
            if (hubResponse.ok) {
              const hubData = await hubResponse.json();
              const selectedHub = hubData.find((h: any) => h.id === riderData.assigned_hub_id);
              if (selectedHub) {
                setHubInfo(selectedHub);
              }
            }
          } catch (err) {
            console.error('Error fetching hub info:', err);
          }
        }

        if (riderData.store_id) {
          try {
            const storeResponse = await fetch(`/api/stores?id=${riderData.store_id}`);
            if (storeResponse.ok) {
              const storeData = await storeResponse.json();
              if (storeData && storeData.length > 0) {
                setStoreInfo(storeData[0]);
              }
            }
          } catch (err) {
            console.error('Error fetching store info:', err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
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
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-600 mt-1">CEE ID: {profile.cee_id}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 font-medium border-b-2 transition-all ${activeTab === 'profile' ? 'text-indigo-600 border-indigo-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
            >
              <User className="w-4 h-4 inline mr-2" /> Profile Information
            </button>
            <button
              onClick={() => setActiveTab('registration')}
              className={`py-4 px-2 font-medium border-b-2 transition-all ${activeTab === 'registration' ? 'text-indigo-600 border-indigo-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
            >
              <FileText className="w-4 h-4 inline mr-2" /> Registration Details
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'registration' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Welcome to inneedit</h2>
              <p className="text-green-50">Thank you for joining our team. Here are your registration details and onboarding information.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" /> Onboarding Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client</label>
                    <p className="text-gray-900 mt-1 font-semibold text-lg capitalize">{profile.client}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Your CEE ID</label>
                    <p className="text-gray-900 mt-1 font-mono font-bold text-lg bg-purple-50 p-3 rounded-lg">{profile.cee_id}</p>
                    <p className="text-xs text-gray-600 mt-2">Use this ID to login to your rider app</p>
                  </div>
                  {profile.join_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Join Date</label>
                      <p className="text-gray-900 mt-1">{new Date(profile.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" /> Vehicle Assignment
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Ownership</label>
                    <p className="text-gray-900 mt-1 font-semibold">{profile.vehicle_ownership === 'company_ev' ? '🚗 Company EV Bike' : '🏍️ Own Vehicle'}</p>
                  </div>
                  {profile.vehicle_ownership === 'company_ev' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">EV Type</label>
                        <p className="text-gray-900 mt-1 font-semibold capitalize">{profile.ev_type === 'fixed_battery' ? '🔋 Fixed Battery' : '🔄 Sunmobility Swap'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Daily Rent</label>
                        <p className="text-gray-900 mt-1 text-lg font-bold">₹{profile.ev_daily_rent}/day</p>
                      </div>
                      {profile.is_leader && profile.leader_discount_percentage ? (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy className="w-5 h-5 text-amber-600" />
                            <span className="text-sm font-bold text-amber-600 uppercase tracking-wide">Leader Benefits</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                              <p className="text-xs text-amber-700 font-medium">Discount</p>
                              <p className="text-lg font-bold text-amber-900">{profile.leader_discount_percentage}%</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="text-xs text-green-700 font-medium">You Pay</p>
                              <p className="text-lg font-bold text-green-900">
                                ₹{Math.round(profile.ev_daily_rent! * (1 - profile.leader_discount_percentage! / 100))}/day
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hubInfo && (
                <section className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" /> Your Hub Location
                  </h3>
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-3">{hubInfo.hub_name}</h4>
                    <div className="space-y-2 text-sm text-indigo-800">
                      <p className="font-medium">{hubInfo.location}</p>
                      <p className="text-indigo-600">{hubInfo.city}</p>
                    </div>
                  </div>
                </section>
              )}
              {storeInfo && (
                <section className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" /> Your Store Location
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">{storeInfo.store_name}</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p className="font-medium">{storeInfo.location}</p>
                      <p className="text-blue-600">{storeInfo.city}</p>
                      {storeInfo.store_manager_name && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs font-medium text-blue-700 mb-1">Store Manager</p>
                          <p className="font-semibold text-blue-900">{storeInfo.store_manager_name}</p>
                          {storeInfo.store_manager_phone && (
                            <p className="text-blue-700 mt-1">{storeInfo.store_manager_phone}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {(hubInfo || storeInfo) && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                    <li>Visit the hub and store locations</li>
                    <li>Contact the hub and store managers</li>
                    <li>Complete handover process</li>
                    <li>Start your deliveries</li>
                  </ol>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
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
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {profile.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-600" /> Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900 mt-1">{profile.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900 mt-1">{profile.email || 'Not provided'}</p>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" /> Account Timeline
                </h3>
                <div className="space-y-4">
                  {profile.join_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Join Date</label>
                      <p className="text-gray-900 mt-1">{new Date(profile.join_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  )}
                  {profile.created_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Profile Created</label>
                      <p className="text-gray-900 mt-1">{new Date(profile.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
