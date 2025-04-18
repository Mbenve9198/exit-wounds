import Link from 'next/link';

export default function UnsubscribeSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md border-2 border-black">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">You Tapped Out!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Just like in BJJ, sometimes you need to tap before you nap... or before your inbox fills up with my nonsense.
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <div className="rounded-full bg-yellow-200 p-4 mx-auto w-16 h-16 flex items-center justify-center border-2 border-black">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <p className="mt-6 text-base text-gray-800">
            You're officially off my email choke-hold. Your inbox will no longer be traumatized by my startup failure stories.
          </p>
          
          <p className="mt-4 text-sm text-gray-600">
            Did you tap out too early? Unlike in startup life, here you can always get back in the game. Just sign up again whenever you miss the pain.
          </p>
          
          <div className="mt-8">
            <Link href="/" className="bg-black text-white py-2 px-6 rounded-full hover:bg-opacity-80 transition-all inline-block font-medium">
              Back to the Dojo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 