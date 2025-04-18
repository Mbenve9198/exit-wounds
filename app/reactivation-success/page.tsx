import Link from 'next/link';

export default function ReactivationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md border-2 border-black">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">We're Back In Business!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Like every toxic relationship, we knew you'd come back for more punishment.
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <div className="rounded-full bg-yellow-200 p-4 mx-auto w-16 h-16 flex items-center justify-center border-2 border-black">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          
          <p className="mt-6 text-base text-gray-800">
            Your subscription is now fully reactivated! Your inbox is officially back on the chopping block for weekly trauma cartoons.
          </p>
          
          <p className="mt-4 text-sm text-gray-600">
            I promise to resume your regularly scheduled dose of startup PTSD, poorly drawn illustrations, and questionable life advice ASAP.
          </p>
          
          <div className="mt-8">
            <Link href="/" className="bg-black text-white py-2 px-6 rounded-full hover:bg-opacity-80 transition-all inline-block font-medium">
              Return to Safety (Temporarily)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 