"use client"

import { useState } from 'react'
import { Copy, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CVParserDebugPanelProps {
  rawText: string
  confidence?: number
  isOpen: boolean
  onClose: () => void
}

export function CVParserDebugPanel({ 
  rawText, 
  confidence, 
  isOpen, 
  onClose 
}: CVParserDebugPanelProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  if (!isOpen) return null

  const handleCopyText = () => {
    navigator.clipboard.writeText(rawText || '')
      .then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      })
      .catch(err => {
        console.error('Failed to copy text: ', err)
      })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">CV Parser Debug Information</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 overflow-auto flex-grow">
          {confidence !== undefined && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Parser Confidence: {confidence}%</p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600" 
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Extracted Raw Text:</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center gap-1"
                onClick={handleCopyText}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Text
              </Button>
            </div>
            <Textarea 
              value={rawText || 'No text was extracted from the document.'}
              readOnly
              className="h-80 font-mono text-xs"
            />
          </div>

          {copySuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800 mb-4">
              <AlertDescription>Text copied to clipboard successfully!</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-500 space-y-2">
            <p>
              <strong>What is this?</strong> This shows the raw text extracted from your CV document.
            </p>
            <p>
              <strong>Why is this useful?</strong> If the CV parser isn't correctly identifying your information, 
              this can help you understand why and how to format your CV for better results.
            </p>
            <p>
              <strong>How to use this:</strong> Check if your CV content was properly extracted. If sections are 
              missing or incorrect, you might need to adjust your CV format or manually enter the information.
            </p>
          </div>
        </div>

        <div className="p-4 border-t">
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </Card>
    </div>
  )
}
