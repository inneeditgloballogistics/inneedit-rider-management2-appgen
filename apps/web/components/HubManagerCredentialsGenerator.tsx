'use client';

import { useState, useEffect } from 'react';

interface Hub {
  id: number;
  hub_name: string;
  hub_code: string;
  manager_name: string;
  manager_email?: string;
}

export default function HubManagerCredentialsGenerator() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<any>(null);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      const res = await fetch('/api/hubs');
      const data = await res.json();
      setHubs(data);
    } catch (error) {
      console.error('Error fetching hubs:', error);
      setMessage('Failed to fetch hubs');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setGeneratedCreds(null);

    if (!selectedHub || !email || !password) {
      setMessage('Please select a hub and enter email and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/hub-manager-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hub_id: selectedHub.id,
          email,
          password,
          manager_name: selectedHub.manager_name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setGeneratedCreds(data);
        setMessage('✅ Credentials created successfully!');
        setEmail('');
        setPassword('');
        setSelectedHub(null);
        // Refresh hubs list
        fetchHubs();
      } else {
        setMessage(`❌ ${data.error || 'Failed to create credentials'}`);
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
            <i className="ph-bold ph-key text-lg"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Generate Hub Manager Credentials</h3>
        </div>
        <p className="text-sm text-slate-600">
          Create login credentials (email + password) for hub managers. They can then login to their dashboard using these credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {/* Hub Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Select Hub <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedHub?.id || ''}
            onChange={(e) => {
              const hub = hubs.find(h => h.id === Number(e.target.value));
              setSelectedHub(hub || null);
            }}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
          >
            <option value="">-- Select a hub --</option>
            {hubs.map(hub => (
              <option key={hub.id} value={hub.id}>
                {hub.hub_name} ({hub.hub_code}) - {hub.manager_name}
              </option>
            ))}
          </select>
        </div>

        {selectedHub && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600"><strong>Hub:</strong> {selectedHub.hub_name}</p>
            <p className="text-sm text-slate-600"><strong>Manager:</strong> {selectedHub.manager_name}</p>
            {selectedHub.manager_email && (
              <p className="text-sm text-slate-600"><strong>Current Email:</strong> {selectedHub.manager_email}</p>
            )}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Manager Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., manager@inneedit.com"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1.5">This will be the login email for the hub manager</p>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <i className={`ph-fill ${showPassword ? 'ph-eye-slash' : 'ph-eye'}`}></i>
              </button>
            </div>
            <button
              type="button"
              onClick={generatePassword}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
              title="Generate a random secure password"
            >
              <i className="ph-bold ph-shuffle text-lg"></i>Generate
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Share this password with the hub manager securely</p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg text-sm border ${
            message.startsWith('✅')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {generatedCreds && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <i className="ph-bold ph-check-circle text-lg"></i>
              Credentials Generated Successfully!
            </div>
            <div className="space-y-2 text-sm text-slate-700 bg-white rounded p-3 border border-green-200">
              <p><strong>Hub:</strong> {selectedHub?.hub_name} ({selectedHub?.hub_code})</p>
              <p><strong>Email:</strong> <code className="bg-slate-100 px-2 py-1 rounded">{generatedCreds.instructions.email}</code></p>
              <p><strong>Password:</strong> <code className="bg-slate-100 px-2 py-1 rounded">{generatedCreds.instructions.password}</code></p>
              <p><strong>Login URL:</strong> <code className="bg-slate-100 px-2 py-1 rounded">/login</code></p>
              <p className="text-xs text-slate-600 italic mt-2">{generatedCreds.instructions.note}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              setEmail('');
              setPassword('');
              setSelectedHub(null);
              setMessage('');
              setGeneratedCreds(null);
            }}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center gap-2"
          >
            <i className="ph-bold ph-x"></i>Clear
          </button>
          <button
            type="submit"
            disabled={loading || !selectedHub || !email || !password}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <i className="ph ph-circle-notch animate-spin text-lg"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="ph-bold ph-key"></i>
                Create Credentials
              </>
            )}
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="ph-bold ph-info text-lg text-blue-600"></i>
          How It Works
        </h4>
        <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
          <li>Select the hub for which you want to create manager credentials</li>
          <li>Enter the manager's email address (this will be their login ID)</li>
          <li>Enter or generate a secure password</li>
          <li>Click "Create Credentials" to save</li>
          <li>Share the email and password with the hub manager securely</li>
          <li>Hub manager can login at /login by selecting "Hub Manager" tab</li>
          <li>After first login, manager can update their profile and change password</li>
        </ol>
      </div>

      {/* Hub Manager Dashboard Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="ph-bold ph-building text-lg text-blue-600"></i>
          Hub Manager Dashboard
        </h4>
        <p className="text-sm text-slate-700 mb-3">
          Once logged in, hub managers can:
        </p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <i className="ph-bold ph-check text-green-600"></i>
            View their hub information and location
          </li>
          <li className="flex items-center gap-2">
            <i className="ph-bold ph-check text-green-600"></i>
            Monitor all riders assigned to their hub
          </li>
          <li className="flex items-center gap-2">
            <i className="ph-bold ph-check text-green-600"></i>
            View vehicles at their hub
          </li>
          <li className="flex items-center gap-2">
            <i className="ph-bold ph-check text-green-600"></i>
            Track daily orders and capacity
          </li>
          <li className="flex items-center gap-2">
            <i className="ph-bold ph-check text-green-600"></i>
            Access hub-specific analytics and reports
          </li>
        </ul>
      </div>
    </div>
  );
}
