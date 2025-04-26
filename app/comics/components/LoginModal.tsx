'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      
      // Notify parent component
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {showRegister ? 'Create Account' : 'Login Required'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
              {error}
            </div>
          )}
          
          {showRegister ? (
            <div>
              <p className="mb-4">
                To create an account, please visit the main website:
              </p>
              <Link 
                href="/"
                className="block w-full py-3 px-6 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
              >
                Go to Registration
              </Link>
              <p className="mt-4 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button 
                  onClick={() => setShowRegister(false)}
                  className="text-blue-600 hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              
              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-6 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px] ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
                
                <div className="text-center text-sm text-gray-500">
                  <Link href="/forgot-password" className="text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                
                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Register
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
        
        <div className="p-5 border-t text-sm text-gray-500">
          <p>Login to access Exit Wounds comics and more traumatizing content.</p>
        </div>
      </div>
    </div>
  );
} 