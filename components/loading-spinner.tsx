"use client"

import { Loader2, FileText, Upload, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LoadingSpinnerProps {
  message?: string
  progress?: number
  stage?: 'uploading' | 'parsing' | 'analyzing' | 'complete'
}

export function LoadingSpinner({ message = "Loading...", progress, stage }: LoadingSpinnerProps) {
  const getStageInfo = () => {
    switch (stage) {
      case 'uploading':
        return { icon: Upload, text: "Uploading your CV...", color: "text-blue-600" }
      case 'parsing':
        return { icon: FileText, text: "Parsing CV content...", color: "text-orange-600" }
      case 'analyzing':
        return { icon: Loader2, text: "Analyzing and optimizing...", color: "text-purple-600" }
      case 'complete':
        return { icon: CheckCircle, text: "Complete!", color: "text-green-600" }
      default:
        return { icon: Loader2, text: message, color: "text-blue-600" }
    }
  }

  const { icon: Icon, text, color } = getStageInfo()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <Icon className={`h-8 w-8 ${color} ${stage !== 'complete' ? 'animate-spin' : ''}`} />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">{text}</p>
            {progress !== undefined && (
              <div className="w-full">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FullPageLoader({ message = "Loading...", stage }: { message?: string, stage?: LoadingSpinnerProps['stage'] }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner message={message} stage={stage} />
    </div>
  )
}