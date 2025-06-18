import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface CVTemplateDetectionMessageProps {
  isOwnTemplate: boolean;
  templateType?: string;
}

export function CVTemplateDetectionMessage({ isOwnTemplate, templateType }: CVTemplateDetectionMessageProps) {
  if (!isOwnTemplate) return null;

  const templateNames: Record<string, string> = {
    'professional': 'Corporate Professional',
    'modern': 'Modern Minimalist',
    'creative': 'Creative Design',
    'simple': 'Simple Clean',
    'executive': 'Executive Elite',
    'technical': 'Technical Expert',
    'graduate': 'Graduate Entry',
    'digital': 'Digital Portfolio'
  };

  const templateName = templateType ? templateNames[templateType] || templateType : 'one of our templates';

  return (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">CV Template Detected</AlertTitle>
      <AlertDescription className="text-green-700">
        We've detected that this CV was created using {templateName} template. 
        Your information has been extracted with high accuracy.
      </AlertDescription>
    </Alert>
  );
}
