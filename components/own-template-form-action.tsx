import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Save } from 'lucide-react';
import type { TemplateType } from '@/types/cv-types';
import type { CVData } from '@/types/cv-types';

interface OwnTemplateFormActionProps {
  isOwnTemplate: boolean;
  detectedTemplateType?: string;
  currentTemplateType: TemplateType;
  cvData: CVData;
  onSelectDetectedTemplate: () => void;
}

export function OwnTemplateFormAction({
  isOwnTemplate,
  detectedTemplateType,
  currentTemplateType,
  cvData,
  onSelectDetectedTemplate
}: OwnTemplateFormActionProps) {
  if (!isOwnTemplate || !detectedTemplateType) return null;

  // If the detected template is already selected, don't show this component
  if (detectedTemplateType === currentTemplateType) return null;

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
      <h3 className="font-medium text-blue-800 mb-2">Template Mismatch Detected</h3>
      <p className="text-sm text-blue-700 mb-3">
        This CV was created with our {detectedTemplateType} template, but you're currently using the {currentTemplateType} template.
      </p>
      <Button 
        variant="outline" 
        size="sm"
        className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
        onClick={onSelectDetectedTemplate}
      >
        Switch to {detectedTemplateType} template
      </Button>
    </div>
  );
}
