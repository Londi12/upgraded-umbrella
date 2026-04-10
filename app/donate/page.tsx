import Image from "next/image"
import { Heart, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Support CVKonnekt | Donate",
  description: "Help keep CVKonnekt free for South African job seekers.",
}

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-red-500 fill-current" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Support CVKonnekt</h1>
        <p className="text-gray-600 mb-10">
          CVKonnekt is built to help South Africans land jobs. If it's helped you, consider buying us a coffee — every contribution keeps the platform free and growing.
        </p>

        <div className="grid gap-6">
          {/* SnapScan */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Copy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">SnapScan</h2>
                <p className="text-xs text-gray-500">Scan the QR code below</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/SnapCode_X_26gpWE.png"
                alt="SnapScan QR Code"
                width={200}
                height={200}
                className="rounded-xl border border-gray-100"
              />
            </div>
            <div className="mt-4 text-center">
              <a
                href="https://pos.snapscan.io/qr/rFvEjDOb"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="text-sm">Open SnapScan Link</Button>
              </a>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Donations are voluntary and go directly towards server costs and development. Thank you 🙏
        </p>
      </div>
    </div>
  )
}
