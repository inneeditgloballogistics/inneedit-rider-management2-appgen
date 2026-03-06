'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

function RiderRegistrationContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // State management
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    mobile: '',
    email: '',
    address: '',
    client: '',
    ceeId: '',
    assignedHub: '',
    storeLocation: '',
    vehicle: '',
    bankAccount: '',
    ifscCode: '',
    beneficiaryName: '',
    vehicleOwnership: 'company_ev',
    evMonthlyRent: '6000',
    evWeeklyRent: '1500',
    isLeader: false,
    leaderDiscount: '0'
  });

  const [dlFile, setDlFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  
  const dlInputRef = useRef<HTMLInputElement>(null);
  const aadharInputRef = useRef<HTMLInputElement>(null);

  // Fetch available vehicles, hubs, and stores on component mount
  useEffect(() => {
    fetchAvailableVehicles();
    fetchHubs();
    fetchStores();
  }, []);

  const fetchAvailableVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles?status=available&cache=' + Date.now());
      if (response.ok) {
        const vehicles = await response.json();
        console.log('Available vehicles fetched:', vehicles);
        setAvailableVehicles(vehicles);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchHubs = async () => {
    try {
      const response = await fetch('/api/hubs');
      if (response.ok) {
        const data = await response.json();
        console.log('Hubs fetched:', data);
        setHubs(data);
      }
    } catch (error) {
      console.error('Error fetching hubs:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      if (response.ok) {
        const data = await response.json();
        console.log('Stores fetched:', data);
        setStores(data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  // Generate CEE ID - keeps the manually entered ID or generates one if empty
  const generateCeeId = () => {
    // If user has already entered a CEE ID, keep it
    if (formData.ceeId && formData.ceeId.trim() !== '') {
      // Just keep the existing ID
      return;
    }
    // Otherwise, generate a new one
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ceeId = `CEE-${randomNum}`;
    setFormData({ ...formData, ceeId });
  };

  // Handle file uploads
  const handleDlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDlFile(e.target.files[0]);
    }
  };

  const handleAadharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAadharFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.mobile || !formData.client || !formData.ceeId) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let dlUrl = null;
      let aadharUrl = null;

      // Upload DL file if provided (optional)
      if (dlFile) {
        const dlFormData = new FormData();
        dlFormData.append('file', dlFile);
        const dlUploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: dlFormData
        });
        const dlData = await dlUploadRes.json();
        dlUrl = dlData.url;
      }

      // Upload Aadhar file if provided (optional)
      if (aadharFile) {
        const aadharFormData = new FormData();
        aadharFormData.append('file', aadharFile);
        const aadharUploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: aadharFormData
        });
        const aadharData = await aadharUploadRes.json();
        aadharUrl = aadharData.url;
      }

      // Save rider data to database
      const riderData = {
        ...formData,
        dlUrl,
        aadharUrl,
        assignedVehicleId: formData.vehicle && formData.vehicle !== 'later' ? parseInt(formData.vehicle) : null,
        vehicleOwnership: formData.vehicleOwnership,
        evMonthlyRent: formData.vehicleOwnership === 'company_ev' ? parseFloat(formData.evMonthlyRent) : null,
        evWeeklyRent: formData.vehicleOwnership === 'company_ev' ? parseFloat(formData.evWeeklyRent) : null,
        isLeader: formData.isLeader,
        leaderDiscountPercentage: formData.isLeader ? parseFloat(formData.leaderDiscount) : 0
      };

      const response = await fetch('/api/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(riderData)
      });

      const result = await response.json();

      if (!result.success) {
        const errorMsg = result.error || 'Failed to register rider';
        const details = result.details ? `\n\nDetails: ${result.details}` : '';
        throw new Error(errorMsg + details);
      }

      alert(`Rider registered successfully! CEE ID: ${result.ceeId}`);
      router.push('/admin-dashboard');
    } catch (error: any) {
      console.error('Error registering rider:', error);
      const errorMessage = error?.message || 'Failed to register rider. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
      <>
        <div className="mesh-bg text-slate-800 antialiased min-h-screen flex flex-col">
          {/* Navigation */}
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="h-10">
                    <img src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" alt="inneedit" className="h-full w-auto" />
                </div>
                <div>
                    <h1 className="font-display font-bold text-base leading-none text-slate-900">inneedit Global Logistics</h1>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rider Registration</span>
                </div>
            </div>

            {/* Desktop Nav - Admin Tabs */}
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
                <button onClick={() => router.push('/admin-dashboard')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    <i className="ph-bold ph-gauge mr-2"></i>Dashboard
                </button>
                <button onClick={() => router.push('/rider-registration')} className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-900 border border-slate-200 transition-all">
                    <i className="ph-bold ph-users mr-2"></i>Riders
                </button>
                <button onClick={() => router.push('/admin-dashboard')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    <i className="ph-bold ph-truck mr-2"></i>Vehicles
                </button>
                <button onClick={() => router.push('/admin-dashboard')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    <i className="ph-bold ph-buildings mr-2"></i>Hubs
                </button>
                <button onClick={() => router.push('/admin-dashboard')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    <i className="ph-bold ph-storefront mr-2"></i>Stores
                </button>
                <button onClick={() => router.push('/payroll-system')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    <i className="ph-bold ph-currency-inr mr-2"></i>Payroll
                </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                    <i className="ph ph-bell text-xl"></i>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-slate-500">{user?.email || 'Bangalore HQ'}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border-2 border-white shadow-md hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center text-white"
                      title="Sign Out"
                    >
                      <i className="ph-bold ph-sign-out text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    {/* Main Content */}
    <main className="flex-grow pt-28 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">New Rider Registration</h2>
                    <p className="text-slate-500 mt-2">Onboard a new rider to the fleet. Create login credentials and assign assets.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/')} className="text-sm font-medium text-slate-500 hover:text-slate-900">Cancel</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Form Column */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Section 1: Personal Details */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                                <span className="font-bold text-sm">1</span>
                            </div>
                            <h3 className="font-display font-semibold text-lg text-slate-900">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Full Name</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Rahul Kumar" 
                                  value={formData.fullName}
                                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium" 
                                />
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Date of Birth</label>
                                <input 
                                  type="date" 
                                  value={formData.dob}
                                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all text-slate-900 font-medium" 
                                />
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-medium">+91</span>
                                    <input 
                                      type="tel" 
                                      placeholder="98765 43210" 
                                      value={formData.mobile}
                                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium" 
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">This will be used for login & OTP.</p>
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Email Address</label>
                                <input 
                                  type="email" 
                                  placeholder="rahul@example.com" 
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium" 
                                />
                            </div>
                            <div className="input-group md:col-span-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Residential Address</label>
                                <textarea 
                                  rows={2} 
                                  placeholder="#123, 4th Cross, 5th Main, Indiranagar, Bangalore" 
                                  value={formData.address}
                                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Hub & Assignment */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                                <span className="font-bold text-sm">2</span>
                            </div>
                            <h3 className="font-display font-semibold text-lg text-slate-900">Hub & Assignment</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Client</label>
                                <select 
                                  value={formData.client} 
                                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all text-slate-900 font-medium appearance-none"
                                >
                                    <option value="">Select client...</option>
                                    <option value="bigbasket">BigBasket</option>
                                    <option value="zepto">Zepto</option>
                                    <option value="blinkit">Blinkit</option>
                                    <option value="swiggy-instamart">Swiggy Instamart</option>
                                    <option value="dunzo">Dunzo</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Assigned Hub</label>
                                <select 
                                  value={formData.assignedHub} 
                                  onChange={(e) => setFormData({ ...formData, assignedHub: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all text-slate-900 font-medium appearance-none"
                                >
                                    <option value="">Select a hub...</option>
                                    {hubs.map((hub) => (
                                      <option key={hub.id} value={hub.id}>
                                        {hub.hub_name} - {hub.location}
                                      </option>
                                    ))}
                                    {hubs.length === 0 && (
                                      <option value="" disabled>No hubs available</option>
                                    )}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Store</label>
                                <select 
                                  value={formData.storeLocation} 
                                  onChange={(e) => setFormData({ ...formData, storeLocation: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all text-slate-900 font-medium appearance-none"
                                >
                                    <option value="">Select a store...</option>
                                    {stores.map((store) => (
                                      <option key={store.id} value={store.id}>
                                        {store.store_name} - {store.location}
                                      </option>
                                    ))}
                                    {stores.length === 0 && (
                                      <option value="" disabled>No stores available</option>
                                    )}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">CEE ID</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Enter CEE ID from BigBasket or generate" 
                                        value={formData.ceeId}
                                        onChange={(e) => setFormData({ ...formData, ceeId: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium font-mono uppercase" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={generateCeeId}
                                        className="absolute right-2 top-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-all"
                                    >
                                        {formData.ceeId ? 'Keep' : 'Generate'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Paste CEE ID from BigBasket, or leave blank and click Generate for auto ID.</p>
                            </div>
                            
                            {/* Vehicle Selection with Status */}
                            <div className="input-group md:col-span-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Assign Vehicle</label>
                                <div className="relative">
                                    <i className="ph-bold ph-scooter absolute left-4 top-3.5 text-slate-400 text-lg"></i>
                                    <select 
                                      value={formData.vehicle} 
                                      onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all text-slate-900 font-medium appearance-none"
                                    >
                                        <option value="">Select available vehicle...</option>
                                        {availableVehicles.map((vehicle) => (
                                          <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicle_number} - {vehicle.vehicle_type} {vehicle.model ? `(${vehicle.model})` : ''}
                                          </option>
                                        ))}
                                        {availableVehicles.length === 0 && (
                                          <option value="" disabled>No available vehicles</option>
                                        )}
                                        <option value="later">Assign Later</option>
                                    </select>
                                    <i className="ph-bold ph-caret-down absolute right-4 top-3.5 text-slate-400 pointer-events-none"></i>
                                </div>
                                {availableVehicles.length === 0 ? (
                                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100 flex gap-3 items-start">
                                    <i className="ph-fill ph-warning text-yellow-500 mt-0.5"></i>
                                    <p className="text-xs text-yellow-700">No available vehicles found. Please add vehicles in the Vehicles tab first, or assign later.</p>
                                  </div>
                                ) : (
                                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-3 items-start">
                                    <i className="ph-fill ph-info text-blue-500 mt-0.5"></i>
                                    <p className="text-xs text-blue-700">Upon assignment, the vehicle will be marked as "Assigned" and reserved for this rider.</p>
                                  </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Vehicle Details */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                                <span className="font-bold text-sm">3</span>
                            </div>
                            <h3 className="font-display font-semibold text-lg text-slate-900">Vehicle Details</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Vehicle Ownership Selection */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Vehicle Ownership</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div 
                                      onClick={() => setFormData({ ...formData, vehicleOwnership: 'own' })}
                                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        formData.vehicleOwnership === 'own' 
                                          ? 'border-brand-600 bg-brand-50' 
                                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          formData.vehicleOwnership === 'own' ? 'border-brand-600' : 'border-slate-300'
                                        }`}>
                                          {formData.vehicleOwnership === 'own' && (
                                            <div className="w-3 h-3 rounded-full bg-brand-600"></div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-slate-900">Own Vehicle</p>
                                          <p className="text-xs text-slate-500">Rider's personal bike</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div 
                                      onClick={() => setFormData({ ...formData, vehicleOwnership: 'company_ev' })}
                                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        formData.vehicleOwnership === 'company_ev' 
                                          ? 'border-brand-600 bg-brand-50' 
                                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          formData.vehicleOwnership === 'company_ev' ? 'border-brand-600' : 'border-slate-300'
                                        }`}>
                                          {formData.vehicleOwnership === 'company_ev' && (
                                            <div className="w-3 h-3 rounded-full bg-brand-600"></div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-slate-900">Company EV Bike</p>
                                          <p className="text-xs text-slate-500">Rental charges apply</p>
                                        </div>
                                      </div>
                                    </div>
                                </div>
                            </div>

                            {/* EV Rental Details - Show only if Company EV selected */}
                            {formData.vehicleOwnership === 'company_ev' && (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="input-group">
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Monthly Rent (₹)</label>
                                    <input 
                                      type="number" 
                                      placeholder="6000" 
                                      value={formData.evMonthlyRent}
                                      onChange={(e) => setFormData({ ...formData, evMonthlyRent: e.target.value })}
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium" 
                                    />
                                  </div>
                                  <div className="input-group">
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Weekly Rent (₹)</label>
                                    <input 
                                      type="number" 
                                      placeholder="1500" 
                                      value={formData.evWeeklyRent}
                                      onChange={(e) => setFormData({ ...formData, evWeeklyRent: e.target.value })}
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium" 
                                    />
                                  </div>
                                </div>

                                {/* Leader/Supervisor Option */}
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                                  <div className="flex items-start gap-3 mb-4">
                                    <input 
                                      type="checkbox"
                                      checked={formData.isLeader}
                                      onChange={(e) => setFormData({ ...formData, isLeader: e.target.checked })}
                                      className="mt-1 w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                                    />
                                    <div>
                                      <h4 className="font-semibold text-purple-900 mb-1">Mark as Store Leader/Supervisor</h4>
                                      <p className="text-xs text-purple-700 leading-relaxed">
                                        Leaders work as riders + supervisors. They monitor other riders, train new joiners, and report to admin. 
                                        Instead of separate salary, they get a discount on EV rent.
                                      </p>
                                    </div>
                                  </div>

                                  {formData.isLeader && (
                                    <div className="mt-4 pt-4 border-t border-purple-200">
                                      <label className="block text-xs font-medium text-purple-700 mb-2 uppercase tracking-wide">Rent Discount (%)</label>
                                      <div className="flex items-center gap-4">
                                        <input 
                                          type="number" 
                                          min="0"
                                          max="100"
                                          placeholder="50" 
                                          value={formData.leaderDiscount}
                                          onChange={(e) => setFormData({ ...formData, leaderDiscount: e.target.value })}
                                          className="w-32 px-4 py-3 rounded-xl border border-purple-200 bg-white outline-none transition-all placeholder:text-purple-400 text-purple-900 font-medium" 
                                        />
                                        <div className="flex-1 p-3 bg-white rounded-lg border border-purple-200">
                                          <p className="text-xs text-purple-600 mb-1 font-medium">Final Rent After Discount:</p>
                                          <div className="flex gap-4">
                                            <span className="text-sm font-semibold text-purple-900">
                                              Monthly: ₹{Math.round((formData.evMonthlyRent || 6000) * (1 - (formData.leaderDiscount || 0) / 100))}
                                            </span>
                                            <span className="text-sm font-semibold text-purple-900">
                                              Weekly: ₹{Math.round((formData.evWeeklyRent || 1500) * (1 - (formData.leaderDiscount || 0) / 100))}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}

                            {formData.vehicleOwnership === 'own' && (
                              <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex gap-3 items-start">
                                <i className="ph-fill ph-info text-green-600 mt-0.5"></i>
                                <div>
                                  <p className="text-sm font-semibold text-green-900 mb-1">Own Vehicle Selected</p>
                                  <p className="text-xs text-green-700">No rental charges will be applied to this rider's payroll.</p>
                                </div>
                              </div>
                            )}
                        </div>
                    </section>

                    {/* Section 4: Payroll & Documents */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                                <span className="font-bold text-sm">4</span>
                            </div>
                            <h3 className="font-display font-semibold text-lg text-slate-900">Payroll & Documents</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="input-group md:col-span-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Bank Account Number</label>
                                <input 
                                  type="text" 
                                  placeholder="XXXXXXXXXXXXXXXX" 
                                  value={formData.bankAccount}
                                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium font-mono" 
                                />
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">IFSC Code</label>
                                <input 
                                  type="text" 
                                  placeholder="HDFC0001234" 
                                  value={formData.ifscCode}
                                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium uppercase" 
                                />
                            </div>
                            <div className="input-group">
                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Beneficiary Name</label>
                                <input 
                                  type="text" 
                                  placeholder="As per bank records" 
                                  value={formData.beneficiaryName}
                                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium" 
                                />
                            </div>
                        </div>

                        {/* Upload Area */}
                        <div className="space-y-4">
                            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Documents (Optional)</label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Upload Box 1 */}
                                <input 
                                  type="file" 
                                  ref={dlInputRef} 
                                  onChange={handleDlUpload} 
                                  accept="image/*,.pdf"
                                  className="hidden" 
                                />
                                <div 
                                  onClick={() => dlInputRef.current?.click()}
                                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors mb-3">
                                        <i className="ph-bold ph-identification-card text-xl"></i>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">Driving License</p>
                                    <p className="text-xs text-slate-400 mt-1">{dlFile ? dlFile.name : 'Front & Back'}</p>
                                    {dlFile && <i className="ph-fill ph-check-circle text-green-500 mt-2"></i>}
                                </div>

                                {/* Upload Box 2 */}
                                <input 
                                  type="file" 
                                  ref={aadharInputRef} 
                                  onChange={handleAadharUpload} 
                                  accept="image/*,.pdf"
                                  className="hidden" 
                                />
                                <div 
                                  onClick={() => aadharInputRef.current?.click()}
                                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors mb-3">
                                        <i className="ph-bold ph-fingerprint text-xl"></i>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">Aadhar Card</p>
                                    <p className="text-xs text-slate-400 mt-1">{aadharFile ? aadharFile.name : 'Identity Proof'}</p>
                                    {aadharFile && <i className="ph-fill ph-check-circle text-green-500 mt-2"></i>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button onClick={() => router.push('/')} className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors">Cancel</button>
                        <button 
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="px-8 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-600/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                              <>
                                <i className="ph-bold ph-circle-notch animate-spin"></i>
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="ph-bold ph-check"></i>
                                Register Rider
                              </>
                            )}
                        </button>
                    </div>

                </div>

                {/* Sidebar Info Column */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Checklist Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-28">
                        <h4 className="font-display font-semibold text-slate-900 mb-4">Registration Checklist</h4>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                    <i className="ph-bold ph-check text-xs"></i>
                                </div>
                                <p className="text-sm text-slate-600">Verify rider age (18+)</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                </div>
                                <p className="text-sm text-slate-600">Collect physical DL copy</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                </div>
                                <p className="text-sm text-slate-600">Assign Hub location</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                </div>
                                <p className="text-sm text-slate-600">Verify Bank Details</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h4 className="font-display font-semibold text-slate-900 mb-2">After Registration</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Once registered, the rider will receive an SMS with their Cee ID and download link for the rider app. They must visit the assigned Hub to collect their vehicle.
                            </p>
                        </div>

                        {/* Cee ID Preview */}
                        <div className="mt-6 bg-slate-900 rounded-xl p-4 text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Generated CEE ID</p>
                            <p className="text-2xl font-mono text-white tracking-wider">{formData.ceeId || 'CEE-____'}</p>
                            <p className="text-[10px] text-slate-500 mt-2">{formData.ceeId ? 'Ready to use' : 'Click Generate button above'}</p>
                        </div>

                        {/* Login Info */}
                        <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100">
                            <div className="flex gap-2 items-start">
                                <i className="ph-fill ph-key text-brand-600 mt-0.5"></i>
                                <div>
                                    <p className="text-xs font-semibold text-brand-900 mb-1">Rider Login Credentials</p>
                                    <p className="text-[10px] text-brand-700 leading-relaxed">
                                        Riders can login to their app using either their registered mobile number or the generated CEE ID.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </main>

    {/* Footer */}
    <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-slate-500">
                    © 2024 inneedit Global Logistics Private Limited. All rights reserved.
                </div>
                <div className="flex gap-6 text-sm font-medium text-slate-600">
                    <a href="#" className="hover:text-slate-900 transition-colors">Help Center</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
        </div>
      </>
    );
}

export default function RiderRegistrationPage() {
  return <RiderRegistrationContent />;
}
