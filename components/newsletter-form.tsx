"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import RegisterModal from "./register-modal"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [showModal, setShowModal] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setShowModal(true)
    }
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
        />
      )}
    </>
  )
}
