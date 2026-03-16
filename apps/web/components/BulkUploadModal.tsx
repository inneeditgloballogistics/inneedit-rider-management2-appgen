'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'riders' | 'hubs' | 'stores' | 'vehicles';
  onSuccess: () => void;
}

export default function BulkUploadModal({ isOpen, onClose, type, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTemplateColumns = () => {
    if (type === 'riders') {
      return [
        'full_name', 'phone', 'email', 'date_of_birth', 'gender', 'address', 'city', 'state', 'pincode',
        'emergency_contact_name', 'emergency_contact_phone', 'client', 'driving_license_number',
        'driving_license_expiry', 'aadhar_number', 'bank_name', 'account_number', 'ifsc_code',
        'vehicle_type', 'assigned_hub_id', 'status', 'vehicle_ownership', 'ev_monthly_rent',
        'ev_weekly_rent', 'is_leader', 'leader_discount_percentage', 'join_date', 'ev_type', 'ev_daily_rent'
      ];
    } else if (type === 'hubs') {
      return ['hub_name', 'hub_code', 'location', 'city', 'state', 'pincode', 'manager_name', 'manager_phone', 'status', 'latitude', 'longitude'];
    } else if (type === 'vehicles') {
      return ['vehicle_number', 'vehicle_type', 'model', 'year', 'assigned_rider_id', 'hub_id', 'status'];
    } else {
      return ['store_name', 'store_code', 'client', 'location', 'city', 'state', 'pincode', 'contact_person', 'contact_phone', 'status', 'latitude', 'longitude', 'store_manager_name', 'store_manager_phone'];
    }
  };

  const downloadTemplate = () => {
    const columns = getTemplateColumns();
    const csvContent = columns.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setShowPreview(false);
      setUploadProgress([]);
    }
  };

  const handlePreview = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data as any[]);
        setShowPreview(true);
      },
      error: (error) => {
        alert(`Error parsing file: ${error.message}`);
      }
    });
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress([]);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const data = results.data as any[];
          const progress: any[] = [];

          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            progress.push({ index: i, status: 'uploading', message: `Row ${i + 2}...` });
            setUploadProgress([...progress]);

            try {
              const endpoint = type === 'riders' ? '/api/riders' : 
                             type === 'hubs' ? '/api/hubs' : 
                             type === 'vehicles' ? '/api/vehicles' :
                             '/api/stores';

              const payload = preparePayload(row);

              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (res.ok) {
                progress[i] = { index: i, status: 'success', message: `✓ Row ${i + 2}` };
              } else {
                const error = await res.json();
                progress[i] = { index: i, status: 'error', message: `✗ Row ${i + 2}: ${error.error || 'Failed'}` };
              }
            } catch (error: any) {
              progress[i] = { index: i, status: 'error', message: `✗ Row ${i + 2}: ${error.message}` };
            }

            setUploadProgress([...progress]);
          }

          setIsUploading(false);
          
          const successCount = progress.filter(p => p.status === 'success').length;
          const totalCount = progress.length;
          
          alert(`Upload complete!\nSuccessful: ${successCount}/${totalCount}`);
          
          if (successCount === totalCount) {
            onSuccess();
            onClose();
          }
        },
        error: (error) => {
          alert(`Error parsing file: ${error.message}`);
          setIsUploading(false);
        }
      });
    } catch (error: any) {
      alert(`Error during upload: ${error.message}`);
      setIsUploading(false);
    }
  };

  const preparePayload = (row: any) => {
    if (type === 'riders') {
      return {
        fullName: row.full_name,
        phone: row.phone,
        email: row.email || null,
        dob: row.date_of_birth || null,
        gender: row.gender || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        pincode: row.pincode || null,
        emergencyContactName: row.emergency_contact_name || null,
        emergencyContactPhone: row.emergency_contact_phone || null,
        client: row.client,
        drivingLicenseNumber: row.driving_license_number || null,
        drivingLicenseExpiry: row.driving_license_expiry || null,
        aadharNumber: row.aadhar_number || null,
        bankName: row.bank_name || null,
        accountNumber: row.account_number || null,
        ifscCode: row.ifsc_code || null,
        vehicleType: row.vehicle_type || null,
        assignedHubId: row.assigned_hub_id ? parseInt(row.assigned_hub_id) : null,
        status: row.status || 'active',
        vehicleOwnership: row.vehicle_ownership || 'company_ev',
        evMonthlyRent: row.ev_monthly_rent ? parseFloat(row.ev_monthly_rent) : null,
        evWeeklyRent: row.ev_weekly_rent ? parseFloat(row.ev_weekly_rent) : null,
        isLeader: row.is_leader === 'true' || row.is_leader === '1',
        leaderDiscountPercentage: row.leader_discount_percentage ? parseFloat(row.leader_discount_percentage) : 0,
        joinDate: row.join_date || null,
        evType: row.ev_type || 'fixed_battery',
        evDailyRent: row.ev_daily_rent ? parseFloat(row.ev_daily_rent) : 215
      };
    } else if (type === 'hubs') {
      return {
        hub_name: row.hub_name,
        hub_code: row.hub_code,
        location: row.location,
        city: row.city || null,
        state: row.state || null,
        pincode: row.pincode || null,
        manager_name: row.manager_name || null,
        manager_phone: row.manager_phone || null,
        status: row.status || 'active',
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null
      };
    } else if (type === 'vehicles') {
      return {
        vehicle_number: row.vehicle_number,
        vehicle_type: row.vehicle_type,
        model: row.model || null,
        year: row.year ? parseInt(row.year) : null,
        assigned_rider_id: row.assigned_rider_id || null,
        hub_id: row.hub_id ? parseInt(row.hub_id) : null,
        status: row.status || 'available'
      };
    } else {
      return {
        store_name: row.store_name,
        store_code: row.store_code,
        client: row.client,
        location: row.location,
        city: row.city || null,
        state: row.state || null,
        pincode: row.pincode || null,
        contact_person: row.contact_person || null,
        contact_phone: row.contact_phone || null,
        status: row.status || 'active',
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        store_manager_name: row.store_manager_name || null,
        store_manager_phone: row.store_manager_phone || null
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-slate-900">
            Bulk Upload - {type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <i className="ph-bold ph-x text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-start gap-3">
            <i className="ph-fill ph-info text-blue-600 mt-0.5"></i>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-2">Download Template First</p>
              <p className="text-xs text-blue-700 mb-3">Download the CSV template, fill in your data, and upload it here.</p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-all"
              >
                <i className="ph-bold ph-download"></i>
                Download Template
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          {!showPreview && !isUploading && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer"
              >
                <i className="ph-duotone ph-cloud-upload text-4xl text-slate-400 block mb-3"></i>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-slate-500">CSV or XLSX files supported</p>
                {file && <i className="ph-fill ph-check-circle text-green-500 mt-2 text-lg block"></i>}
              </div>

              {file && (
                <div className="flex gap-3">
                  <button
                    onClick={handlePreview}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                  >
                    Preview Data
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center justify-center gap-2"
                  >
                    <i className="ph-bold ph-upload"></i>
                    Upload Now
                  </button>
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {showPreview && !isUploading && previewData.length > 0 && (
            <>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-x-auto">
                <p className="text-sm font-semibold text-slate-900 mb-3">Preview ({previewData.length} rows)</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {Object.keys(previewData[0] || {}).slice(0, 5).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-semibold text-slate-700">
                          {key}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center text-slate-700">...</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {Object.keys(row).slice(0, 5).map((key) => (
                          <td key={key} className="px-3 py-2 text-slate-600">
                            {String(row[key]).substring(0, 20)}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center text-slate-400">...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFile(null);
                    setShowPreview(false);
                    setPreviewData([]);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                >
                  Choose Different File
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center justify-center gap-2"
                >
                  <i className="ph-bold ph-upload"></i>
                  Upload All
                </button>
              </div>
            </>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <p className="text-sm font-semibold text-slate-900">Upload Progress</p>
              {uploadProgress.map((item) => (
                <div key={item.index} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                  {item.status === 'uploading' && (
                    <i className="ph-bold ph-circle-notch animate-spin text-blue-600"></i>
                  )}
                  {item.status === 'success' && (
                    <i className="ph-fill ph-check-circle text-green-600"></i>
                  )}
                  {item.status === 'error' && (
                    <i className="ph-fill ph-warning-circle text-red-600"></i>
                  )}
                  <span className={
                    item.status === 'success' ? 'text-green-700' :
                    item.status === 'error' ? 'text-red-700' :
                    'text-slate-600'
                  }>
                    {item.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isUploading && (
          <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
