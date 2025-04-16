import { CheckCircle2 } from "lucide-react"

export default function ApprovalSuccess() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md p-6 border-2 border-black bg-white rounded-lg text-center">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mr-2" />
          <h1 className="text-2xl font-bold font-comic">Subscriber Approved!</h1>
        </div>
        
        <p className="mb-4">
          The subscriber has been approved and will receive their first issue tomorrow.
        </p>
        
        <p className="text-sm text-zinc-500">
          You can close this window now. The subscriber has been notified via email.
        </p>
      </div>
    </main>
  )
} 