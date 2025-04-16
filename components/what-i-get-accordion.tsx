"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WhatIGetAccordion() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleAccordion = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="w-full border-2 border-black rounded-md overflow-hidden">
      <Button
        variant="outline"
        onClick={toggleAccordion}
        className="w-full py-6 border-0 border-b-2 border-black flex items-center justify-between hover:bg-zinc-100 transition-colors rounded-none"
      >
        <div className="flex items-center">
          <span className="mr-2">🧨</span>
          <span className="font-medium">WHAT YOU'LL GET</span>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
      </Button>

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] py-4" : "max-h-0"}`}>
        <div className="px-6 space-y-4">
          <p className="flex items-start">
            <span className="mr-3 text-xl">🧠</span>
            <span>Startup lessons, minus the hustle porn</span>
          </p>

          <p className="flex items-start">
            <span className="mr-3 text-xl">🤖</span>
            <span>AI workflows, even if you can't code</span>
          </p>

          <p className="flex items-start">
            <span className="mr-3 text-xl">💔</span>
            <span>Emotional chaos, handled with dark humor</span>
          </p>

          <p className="flex items-start">
            <span className="mr-3 text-xl">🥋</span>
            <span>Business + BJJ parallels, surprisingly deep</span>
          </p>

          <p className="flex items-start">
            <span className="mr-3 text-xl">🖋️</span>
            <span>Meta commentary, story breakdowns, voice notes</span>
          </p>
        </div>
      </div>
    </div>
  )
}
