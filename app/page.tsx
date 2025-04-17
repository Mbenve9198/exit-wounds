import Image from "next/image"
import NewsletterForm from "@/components/newsletter-form"
import FaqAccordion from "@/components/faq-accordion"
import WhatIGetAccordion from "@/components/what-i-get-accordion"
import WarningAccordion from "@/components/warning-accordion"
import WhoAmIAccordion from "@/components/who-am-i-accordion"
import CountdownTimer from "@/components/countdown-timer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-white">
      {/* Header - Square image with adjusted position */}
      <div className="w-full max-w-md mx-auto aspect-square relative bg-white">
        <Image
          src="/images/header.png"
          alt="EXIT WOUNDS - A comic for founders who survived (barely)"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Content Container - Consistent width and padding */}
      <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Countdown Timer */}
        <CountdownTimer />
        
        {/* Newsletter Signup */}
        <div className="w-full">
          <NewsletterForm />
        </div>

        {/* Links */}
        <div className="w-full space-y-3">
          {/* Who Am I Accordion - Now first */}
          <WhoAmIAccordion />

          {/* What I Get Accordion */}
          <WhatIGetAccordion />

          {/* Warning Accordion */}
          <WarningAccordion />

          {/* FAQ Accordion */}
          <FaqAccordion />
        </div>

        {/* Footer */}
        <footer className="w-full text-center text-sm text-zinc-500 space-y-1">
          <p>© {new Date().getFullYear()} EXIT WOUNDS</p>
          <p className="text-xs italic">Made with anxiety, AI & my girlfriend's patience</p>
        </footer>
      </div>
    </main>
  )
}
