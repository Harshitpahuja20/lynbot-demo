export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  onboardingComplete?: boolean;
  emailVerified?: boolean;
  subscription: {
    plan: string;
    status: string;
  };
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  sessionStorage.setItem('token', token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp <= Date.now() / 1000) {
      removeToken();
      return null;
    }

    const user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      onboardingComplete: payload.onboardingComplete,
      emailVerified: payload.emailVerified,
      subscription: payload.subscription || { plan: 'free', status: 'inactive' }
    };
    
    // Cache the user object to prevent unnecessary re-renders
    return user;
  } catch {
    removeToken();
    return null;
  }
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

export const logout = (): void => {
  removeToken();
  if (typeof window !== 'undefined') {
    // Clear only auth-related data, preserve other app data
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Force a hard reload to clear any cached state
    window.location.replace('/signin');
  }
};