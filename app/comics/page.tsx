'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Comic } from '@/lib/models/Comic';
import LoginModal from './components/LoginModal';

// Set revalidate to 0 to avoid caching
export const dynamic = 'force-dynamic';

async function getPublishedComics(): Promise<Comic[]> {
  try {
    const response = await fetch('/api/comics', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to fetch comics');
    }
    const data = await response.json();
    return data.comics || [];
  } catch (error) {
    console.error('Error retrieving comics:', error);
    return [];
  }
}

// Componente principale con suspense
function ComicsPageContent() {
  const router = useRouter();
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingComic, setLoadingComic] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check URL parameters
    const showLogin = searchParams.get('showLogin');
    if (showLogin === 'true') {
      setShowLoginModal(true);
    }
    
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          cache: 'no-store'
        });
        
        if (response.ok) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    
    // Fetch comics
    const fetchComics = async () => {
      setLoading(true);
      const fetchedComics = await getPublishedComics();
      setComics(fetchedComics);
      setLoading(false);
    };
    
    checkLoginStatus();
    fetchComics();
  }, [searchParams]);
  
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
    // Reload the page to apply authentication
    window.location.reload();
  };
  
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsLoggedIn(false);
        // Reload the page to apply logout
        window.location.reload();
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleComicClick = (comicId: string) => {
    setLoadingComic(comicId);
    router.push(`/comics/${comicId}`);
  };
  
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header with image */}
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
          
          {/* Login/Logout button */}
          <div className="mt-4">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-2 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-sm px-4 py-2 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading comics...</p>
          </div>
        ) : comics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="text-xl font-semibold mt-4">No comics available</h2>
            <p className="text-gray-500 mt-2">Check back later for new content</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {comics.map((comic) => (
              <div 
                key={comic._id?.toString()}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => handleComicClick(comic._id?.toString() || '')}
              >
                <div className="aspect-w-3 aspect-h-4 relative">
                  {loadingComic === comic._id?.toString() ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
                      <div className="w-16 h-16 border-t-4 border-[#FFDD33] border-solid rounded-full animate-spin"></div>
                      <p className="text-white mt-4 font-medium">Loading...</p>
                    </div>
                  ) : null}
                  
                  {comic.images && comic.images.length > 0 ? (
                    <img 
                      src={comic.images[0].url} 
                      alt={comic.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Overlay with gradient for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                  
                  {/* Comic information */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-xl font-bold truncate">{comic.title}</h2>
                    <p className="text-sm opacity-90">{comic.images?.length || 0} pages</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Footer with white background */}
      <footer className="bg-white text-gray-800 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Exit Wounds. All rights reserved.</p>
          <p className="mt-2 text-sm">
            A project by Marco Benvenuti, a traumatized ex-founder.
          </p>
        </div>
      </footer>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

// Componente principale con Suspense
export default function ComicsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <ComicsPageContent />
    </Suspense>
  );
} 