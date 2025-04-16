"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FaqAccordion() {
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
          <span className="mr-2">🙃</span>
          <span className="font-medium">FAQ – BUT LIKE, FOUNDER STYLE</span>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
      </Button>

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] py-4" : "max-h-0"}`}>
        <div className="px-6 space-y-4">
          <div className="space-y-1">
            <p className="font-medium">Q: Is this free?</p>
            <p className="text-zinc-700">A: Until I get therapy and start charging.</p>
          </div>

          <div className="space-y-1">
            <p className="font-medium">Q: Will this help me grow my startup?</p>
            <p className="text-zinc-700">A: Emotionally? Yes. Financially? Maybe.</p>
          </div>

          <div className="space-y-1">
            <p className="font-medium">Q: What if I don't like comics?</p>
            <p className="text-zinc-700">A: You might like this one. Or you'll hate it passionately. Both are good.</p>
          </div>

          <div className="space-y-1">
            <p className="font-medium">Q: Why so much BJJ?</p>
            <p className="text-zinc-700">A: Because startup life chokes you anyway. I just got proactive.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
