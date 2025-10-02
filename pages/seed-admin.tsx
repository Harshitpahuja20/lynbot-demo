import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SeedAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSeedAdmin = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/seed-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      setSuccess(true);
      console.log('Admin user created:', data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Admin User
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Initialize the admin account for the application
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Admin user created successfully! You can now login with:
              <br />
              <strong>Email:</strong> admin@lyncbot.com
              <br />
              <strong>Password:</strong> LyncBot123!
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Admin Credentials</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Email:</strong> admin@lyncbot.com</p>
              <p><strong>Password:</strong> LyncBot123!</p>
            </div>
          </div>

          <button
            onClick={handleSeedAdmin}
            disabled={loading || success}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Admin User...
              </div>
            ) : success ? (
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Admin User Created
              </div>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Create Admin User
              </>
            )}
          </button>

          {success && (
            <div className="text-center">
              <a
                href="/signin"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Go to Sign In →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeedAdminPage;