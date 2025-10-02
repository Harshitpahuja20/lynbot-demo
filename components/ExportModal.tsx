import React, { useState } from 'react';
import { Download, X, FileText, Table, Mail, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospects: any[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, prospects }) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [exportFields, setExportFields] = useState({
    name: true,
    email: true,
    company: true,
    title: true,
    location: true,
    status: true,
    campaign: true,
    linkedinUrl: false,
    phone: false,
    notes: false
  });
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would:
      // 1. Filter prospects based on selected fields
      // 2. Format data according to export format
      // 3. Generate and download file
      
      console.log('Exporting prospects:', { format: exportFormat, fields: exportFields });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Export Prospects</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 border rounded-lg text-center ${
                    exportFormat === 'csv' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-xs">CSV</span>
                </button>
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`p-3 border rounded-lg text-center ${
                    exportFormat === 'excel' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Table className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-xs">Excel</span>
                </button>
                <button
                  onClick={() => setExportFormat('json')}
                  className={`p-3 border rounded-lg text-center ${
                    exportFormat === 'json' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-xs">JSON</span>
                </button>
              </div>
            </div>

            {/* Export Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fields to Export
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(exportFields).map(([field, checked]) => (
                  <label key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setExportFields(prev => ({
                        ...prev,
                        [field]: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={exporting}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {exporting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Exporting...
                </div>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2 inline" />
                  Export ({prospects.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;