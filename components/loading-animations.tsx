"use client"

import { FileText, Upload, Search, Brain, CheckCircle, AlertCircle } from "lucide-react"

export function CVUploadLoader({ progress = 0 }: { progress?: number }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
        <Upload className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-gray-900">Uploading CV...</h3>
        <p className="text-sm text-gray-600">Please wait while we process your file</p>
        {progress > 0 && (
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CVParsingLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin border-t-green-600"></div>
        <FileText className="absolute inset-0 m-auto h-6 w-6 text-green-600" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-gray-900">Parsing CV...</h3>
        <p className="text-sm text-gray-600">Extracting your information</p>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  )
}

export function AIJobMatchingLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
        <Brain className="absolute inset-0 m-auto h-6 w-6 text-purple-600" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-gray-900">AI Analyzing...</h3>
        <p className="text-sm text-gray-600">Finding your perfect job matches</p>
        <div className="text-xs text-purple-600 animate-pulse">
          Powered by AI • Personalized for you
        </div>
      </div>
    </div>
  )
}

export function JobSearchLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
        <Search className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-gray-900">Searching Jobs...</h3>
        <p className="text-sm text-gray-600">Finding opportunities for you</p>
      </div>
    </div>
  )
}

export function SuccessAnimation({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-green-900">Success!</h3>
        <p className="text-sm text-green-700">{message}</p>
      </div>
    </div>
  )
}

export function ErrorAnimation({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-red-900">Upload Failed</h3>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}