"use client"

import type React from "react"

import { useState } from "react"
import { Mail, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !nickname) {
      toast({
        title: "Error",
        description: "Please enter a valid email address and nickname",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: 'dummy-password', nickname }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'An error occurred during subscription')
      }

      toast({
        title: "Subscription complete!",
        description: "Check your email to confirm your subscription",
      })

      setEmail("")
      setNickname("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during subscription",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full p-4 border-2 border-black bg-white rounded-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-3 font-comic flex items-center">
        <Mail className="mr-2 h-5 w-5" />
        Subscribe to the newsletter
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-black py-5 px-4"
            required
          />
          <Input
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border-2 border-black py-5 px-4"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-6 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
          disabled={loading}
        >
          {loading ? "Subscribing..." : "Subscribe, it's free"}
        </button>

        <p className="text-xs text-zinc-500 text-center">No spam. Just comics, experiments, and weird magic.</p>
      </form>
    </div>
  )
}
