import React, { useState } from 'react';
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SeedTestUsersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdUsers, setCreatedUsers] = useState<any[]>([]);

  const handleSeedUsers = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/seed-test-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test users');
      }

      setSuccess(true);
      setCreatedUsers(data.users || []);
      console.log('Test users created:', data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Test Users
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Add test users to the database for development
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
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" />
                Test users created successfully!
              </div>
              {createdUsers.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Created users:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {createdUsers.map((user, index) => (
                      <li key={index}>
                        {user.firstName} {user.lastName} ({user.email})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Test User Credentials</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <div>
                <p><strong>Sean:</strong> sean@sitehues.com / password123</p>
              </div>
              <div>
                <p><strong>Test User:</strong> test@example.com / test123456</p>
              </div>
              <div>
                <p><strong>Demo User:</strong> demo@example.com / demo123456</p>
              </div>
              <div>
                <p><strong>Admin:</strong> admin@lyncbot.com / LyncBot123!</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSeedUsers}
            disabled={loading || success}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Test Users...
              </div>
            ) : success ? (
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Test Users Created
              </div>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Create Test Users
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

export default SeedTestUsersPage;