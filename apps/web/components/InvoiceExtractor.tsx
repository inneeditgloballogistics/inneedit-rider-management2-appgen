'use client';

import { useState, useRef } from 'react';
import { Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface ExtractedInvoice {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  vendor: {
    name: string;
    address: string;
  };
  customer: {
    name: string;
    address: string;
  };
  lineItems: any[];
  subtotal: number;
  tax: number;
  total: number;
  rawEntities: any[];
}

export default function InvoiceExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/invoice-extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to extract invoice');
        return;
      }

      setExtracted(result.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while extracting invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6" />
        Invoice Extractor
      </h2>

      {/* File Upload Section */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDragDrop}
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center mb-6 cursor-pointer hover:border-blue-500 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.tiff"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="w-10 h-10 mx-auto mb-2 text-blue-400" />
        <p className="text-lg font-semibold mb-1">
          {file ? file.name : 'Drag & drop your invoice here'}
        </p>
        <p className="text-gray-500 text-sm">
          Supported formats: PDF, JPG, PNG, TIFF
        </p>
      </div>

      {/* Extract Button */}
      <button
        onClick={handleExtract}
        disabled={!file || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Extracting...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Extract Invoice Data
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Extracted Data Display */}
      {extracted && (
        <div className="mt-8 space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-semibold">Invoice extracted successfully!</p>
          </div>

          {/* Invoice Header Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Invoice Number</label>
              <p className="text-lg text-gray-900">{extracted.invoiceNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Date</label>
              <p className="text-lg text-gray-900">{extracted.date || 'N/A'}</p>
            </div>
          </div>

          {/* Vendor Info */}
          {(extracted.vendor.name || extracted.vendor.address) && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg mb-3">From (Vendor)</h3>
              <p className="text-gray-700">{extracted.vendor.name || 'N/A'}</p>
              <p className="text-gray-600 text-sm">{extracted.vendor.address || 'N/A'}</p>
            </div>
          )}

          {/* Customer Info */}
          {(extracted.customer.name || extracted.customer.address) && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg mb-3">Bill To (Customer)</h3>
              <p className="text-gray-700">{extracted.customer.name || 'N/A'}</p>
              <p className="text-gray-600 text-sm">{extracted.customer.address || 'N/A'}</p>
            </div>
          )}

          {/* Line Items */}
          {extracted.lineItems.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg mb-3">Line Items</h3>
              <div className="space-y-2">
                {extracted.lineItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-800">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-6 bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              {extracted.subtotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">${extracted.subtotal.toFixed(2)}</span>
                </div>
              )}
              {extracted.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-semibold">${extracted.tax.toFixed(2)}</span>
                </div>
              )}
              {extracted.total > 0 && (
                <div className="flex justify-between border-t pt-2 text-lg">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-blue-600">${extracted.total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Raw Entities (for debugging) */}
          {extracted.rawEntities.length > 0 && (
            <div className="border-t pt-6">
              <details className="cursor-pointer">
                <summary className="font-semibold text-gray-700 hover:text-gray-900">
                  Show Raw Extracted Entities ({extracted.rawEntities.length})
                </summary>
                <div className="mt-4 space-y-2">
                  {extracted.rawEntities.map((entity, idx) => (
                    <div key={idx} className="p-3 bg-gray-100 rounded text-sm">
                      <div className="font-semibold text-gray-800">{entity.type}</div>
                      <div className="text-gray-700">{entity.text}</div>
                      <div className="text-gray-500 text-xs">Confidence: {entity.confidence}</div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
