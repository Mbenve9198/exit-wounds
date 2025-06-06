'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Componente principale con Suspense
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Automatically redirect if no token is provided
  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
    }
  }, [token, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setErrorMessage('All fields are required');
      setSubmitStatus('error');
      return;
    }
    
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long. Make it stronger than your coffee.');
      setSubmitStatus('error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords don\'t match. Like your expectations and startup reality.');
      setSubmitStatus('error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');
      setErrorMessage('');
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitStatus('success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(data.error || 'Failed to reset password');
        setSubmitStatus('error');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Like your startup, but faster.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!token) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="py-6 bg-white">
        <div className="container mx-auto px-4 text-center">
          <Link href="/" className="inline-block">
            <Image 
              src="/images/header_comics.png" 
              alt="Exit Wounds" 
              width={300}
              height={100}
              className="h-auto"
              priority
            />
          </Link>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white p-8 border-2 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0)]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
            <p className="text-gray-600">
              Choose a strong password. Unlike your startup's runway, make it last.
            </p>
          </div>
          
          {submitStatus === 'success' ? (
            <div className="text-center">
              <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
                <p className="font-medium">Password reset successful!</p>
                <p className="text-sm mt-1">
                  Remember it this time, or write it down somewhere insecure like everyone else.
                </p>
              </div>
              
              <Link 
                href="/comics" 
                className="inline-block py-3 px-6 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
              >
                Go to Comics
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {submitStatus === 'error' && (
                <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
                  {errorMessage}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="********"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="********"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className={`w-full py-3 px-6 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px] ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 Exit Wounds. All rights reserved.</p>
          <p className="mt-2">
            A project by Marco Benvenuti, a traumatized ex-founder.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Componente wrapper con Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
} 