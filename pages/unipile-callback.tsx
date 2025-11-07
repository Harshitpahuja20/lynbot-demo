import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const UnipileCallback: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing LinkedIn connection...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { account_id, provider_status } = router.query;

        if (!account_id) {
          setStatus('error');
          setMessage('Missing account information');
          return;
        }

        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
          setStatus('error');
          setMessage('Authentication required. Please log in.');
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }

        const response = await fetch('/api/user/linkedin-account', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            useUnipile: true,
            unipile_account_id: account_id,
            provider_status: provider_status || 'connected'
          })
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('LinkedIn account connected successfully!');
          setTimeout(() => {
            window.close();
            if (window.opener) {
              window.opener.postMessage({ type: 'unipile-success' }, '*');
            }
          }, 2000);
        } else {
          throw new Error(data.error || 'Failed to save connection');
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Connection failed');
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting...</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UnipileCallback;
