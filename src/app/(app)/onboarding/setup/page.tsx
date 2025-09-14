'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, User, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const steps = [
  { id: 'profile', title: 'Set Up Your Profile', description: 'Let your partner know who you are.' },
  { id: 'preferences', title: 'Set Your Preferences', description: 'Customize your experience.' },
  { id: 'waiting', title: 'Waiting for Your Partner', description: 'You are all set! We will notify you when your partner accepts.' },
];

export default function InviterOnboardingSetupPage() {
  const { userDetails, refetchUserDetails, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: userDetails?.full_name || '',
    bio: userDetails?.bio || '',
    timezone: userDetails?.timezone || 'UTC',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // This would be an API call to update the user's profile
      // For now, we'll simulate it and move to the next step.
      // await apiClient.updateUser(profileData);
      toast.success('Profile saved!');
      await refetchUserDetails();
      setCurrentStep(currentStep + 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleFinish = () => {
    // After setup, the user is sent to the pending page to wait.
    router.push('/invite-partner/pending');
  };

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'profile':
        return (
          <div className="space-y-4">
            <Input name="fullName" value={profileData.fullName} onChange={handleProfileChange} placeholder="Full Name" />
            <Textarea name="bio" value={profileData.bio} onChange={handleProfileChange} placeholder="A short bio about yourself" />
            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
              Save and Continue
            </Button>
          </div>
        );
      case 'preferences':
        return (
          <div>
            <p className="text-center text-muted-foreground mb-4">Preference settings will go here.</p>
            <Button onClick={handleNextStep} className="w-full">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      case 'waiting':
        return (
          <div className="text-center">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">You can now proceed to the waiting area.</p>
            <Button onClick={handleFinish} className="w-full">Go to Waiting Page</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
