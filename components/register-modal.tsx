"use client"

import { useState } from "react"
import { X, User, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface RegisterModalProps {
  email: string
  onClose: () => void
}

export default function RegisterModal({ email, onClose }: RegisterModalProps) {
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nickname || !password) {
      toast({
        title: "Oops!",
        description: "We need both your nickname and password to create your account",
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
        body: JSON.stringify({ email, password, nickname }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Something went wrong... like your startup probably')
      }

      toast({
        title: "Welcome to the club!",
        description: "Check your email to confirm your subscription. Don't worry, we won't sell your data... much",
      })

      onClose()
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg border-2 border-black max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 hover:bg-zinc-100 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 font-comic">
          Almost there! Just a few more details...
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <Input
                type="text"
                placeholder="Your nickname (or whatever you want to be called)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full border-2 border-black py-5 px-4"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <Input
                type="password"
                placeholder="Create a password (make it better than 'password123')"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-black py-5 px-4"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
            disabled={loading}
          >
            {loading ? "Creating your account..." : "Join the fun!"}
          </button>

          <p className="text-xs text-zinc-500 text-center">
            By subscribing, you agree to receive our emails and probably some existential crisis
          </p>
        </form>
      </div>
    </div>
  )
} 