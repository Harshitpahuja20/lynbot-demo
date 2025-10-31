import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout } from '../utils/auth';
import { 
  Shield,
  User,
  LogOut,
  Home,
  Target,
  Users,
  MessageSquare,
  Zap,
  BarChart3,
  Settings,
  AlertCircle,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  error?: string;
  onClearError?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, error, onClearError }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount and route changes
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      console.log(`currentUser ${JSON.stringify(currentUser)}`)
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        router.push('/signin');
      } else if (currentUser.role === 'admin' && router.pathname.startsWith('/admin')) {
        // Admin users accessing admin routes should stay on admin routes
        return;
      } else if (currentUser.role === 'admin' && !router.pathname.startsWith('/admin')) {
        // Admin users accessing non-admin routes should be redirected to admin
        router.push('/admin/users');
      }
    };

    checkAuth();

    // Listen for storage changes (token updates from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
    }

  const handleLogout = () => {
    console.log('Logging out...');
    logout();
  };

  // Define navigation items for regular users
  const userNavigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/campaigns', label: 'Campaigns', icon: Target },
    { href: '/prospects', label: 'Prospects', icon: Users },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/knowledge', label: 'Knowledge Base', icon: Shield },
    { href: '/automation', label: 'Automation', icon: Zap },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  // Define navigation items for admin users
  const adminNavigationItems = [
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/ai-knowledge', label: 'Global AI Knowledge', icon: Shield },
    { href: '/admin/user-knowledge', label: 'User Knowledge', icon: MessageSquare },
    { href: '/admin/onboarding', label: 'Onboarding', icon: Target },
  ];

  // Select navigation items based on user role
  const navigationItems = user?.role === 'admin' ? adminNavigationItems : userNavigationItems;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {user?.role === 'admin' ? 'Lync Bot Admin' : 'Lync Bot Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {user?.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-blue-600" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {user?.firstName || user?.email}
                  </div>
                  <div className="text-gray-500 capitalize">
                    {user?.role === 'admin' ? 'Administrator' : `${user?.role} - ${user?.subscription?.plan || 'free'}`}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="bg-white border-r border-gray-200 w-64 flex-shrink-0 overflow-y-auto">
          <div className="px-4 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.role === 'admin' ? 'Admin Panel' : 'Navigation'}
            </h2>
          </div>
          <nav className="mt-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
                {onClearError && (
                  <button
                    onClick={onClearError}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;