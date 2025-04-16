"use client"

import { useState } from "react"
import { Mail, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import RegisterModal from "./register-modal"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setShowModal(true)
    }
  }

  const handleSuccess = () => {
    console.log('Registration successful, setting isSubscribed to true')
    setIsSubscribed(true)
    setShowModal(false)
  }

  if (isSubscribed) {
    return (
      <div className="w-full p-4 border-2 border-black bg-white rounded-md max-w-md mx-auto">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500 mr-2" />
          <h2 className="text-lg font-bold font-comic">Welcome to the Waiting Room</h2>
        </div>
        
        <div className="space-y-4 text-center">
          <p className="text-sm">
            Your application to join the club of misfits has been received. 
            Now comes the fun part: waiting to see if you're worthy.
          </p>
          
          <p className="text-sm">
            Check your email (yes, even the spam folder, we're not above that) 
            and tell us your story. Failed startup? Future founder? Just here for the existential crisis? 
            We're all ears (and slightly judgmental).
          </p>
          
          <p className="text-xs text-zinc-500">
            P.S. If you don't hear back, don't take it personally. 
            We're just practicing our rejection skills, honed by years of investor meetings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full p-4 border-2 border-black bg-white rounded-md max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-3 font-comic flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Subscribe to the newsletter
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Your email (we promise not to spam... much)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-black py-5 px-4"
            required
          />

          <button
            type="submit"
            className="w-full py-3 px-6 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
          >
            Subscribe, it's free (unlike therapy)
          </button>

          <p className="text-xs text-zinc-500 text-center">
            No spam. Just comics, experiments, and weird magic. And maybe some existential crisis.
          </p>
        </form>
      </div>

      {showModal && (
        <RegisterModal
          email={email}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
