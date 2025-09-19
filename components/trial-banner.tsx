"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Star } from "lucide-react";
import { TrialService } from "@/lib/trial-service";

export default function TrialBanner() {
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const trialService = new TrialService();

  useEffect(() => {
    const status = trialService.getTrialStatus();
    setTrialStatus(status);
  }, []);

  const startTrial = () => {
    const status = trialService.startTrial();
    setTrialStatus(status);
  };

  if (!trialStatus) return null;

  // Show start trial button if no trial started
  if (!trialStatus.isActive && !trialStatus.hasExpired) {
    return (
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Start Your 7-Day Free Trial</h3>
                <p className="text-sm text-blue-700">Access all basic features including job search, CV builder, and more!</p>
              </div>
            </div>
            <Button onClick={startTrial} className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show trial active status
  if (trialStatus.isActive) {
    return (
      <Card className="bg-green-50 border-green-200 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Free Trial Active</h3>
              <p className="text-sm text-green-700">
                {trialStatus.daysRemaining} days remaining • Upgrade anytime for premium features
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show trial expired
  if (trialStatus.hasExpired) {
    return (
      <Card className="bg-orange-50 border-orange-200 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-900">Trial Expired</h3>
              <p className="text-sm text-orange-700">Choose a plan to continue using all features</p>
            </div>
            <Button className="bg-orange-600 hover:bg-orange-700">
              Choose Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}