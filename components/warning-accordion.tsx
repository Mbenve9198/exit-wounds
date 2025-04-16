"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WarningAccordion() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleAccordion = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="w-full border-2 border-black rounded-md overflow-hidden">
      <Button
        variant="outline"
        onClick={toggleAccordion}
        className={`w-full py-6 border-0 border-b-2 border-black flex items-center justify-between rounded-none ${
          isOpen ? "bg-yellow-50" : "warning-pulse"
        }`}
      >
        <div className="flex items-center">
          <span className="mr-2">⚠️</span>
          <span className="font-medium">CONTENT WARNING - PEGI 18</span>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
      </Button>

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] py-4" : "max-h-0"}`}>
        <div className="px-6 space-y-4">
          <p className="font-medium">This isn't for everyone.</p>

          <div className="space-y-2">
            <p className="font-medium">Inside you'll find:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Spicy content</li>
              <li>Unfiltered trauma</li>
              <li>Swearing, anxiety, AI animals</li>
              <li>Humor that sometimes punches down (at me)</li>
            </ul>
          </div>

          <div className="mt-4">
            <p className="font-medium">If you're easily offended...</p>
            <p className="italic">…you're absolutely in the right place.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
