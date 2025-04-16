"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WhoAmIAccordion() {
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
          <span className="mr-2">🤔</span>
          <span className="font-medium">WHO AM I?</span>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
      </Button>

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] py-4" : "max-h-0"}`}>
        <div className="px-6 space-y-4">
          <div className="space-y-2">
            <p>I sold my startup before it crashed.</p>
            <p>I became Head of Sales of the company who bought us.</p>
            <p>I started building AI tools I don't understand.</p>
            <p>And I started drawing.</p>
          </div>

          <div className="mt-4 space-y-2">
            <p>This is the unfiltered, illustrated diary of my afterlife as a founder.</p>
            <p className="italic">If that sounds weird... wait until you read it.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
