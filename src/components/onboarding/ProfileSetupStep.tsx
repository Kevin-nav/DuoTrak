'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface ProfileSetupStepProps {
  data: any;
  updateData: (updates: any) => void;
  onValidationChange: (isValid: boolean) => void;
  onComplete: () => void;
}

export default function ProfileSetupStep({ data, updateData, onValidationChange, onComplete }: ProfileSetupStepProps) {
  const { userDetails, refetchUserDetails } = useUser();
  const [fullName, setFullName] = useState(data.profile.fullName || userDetails?.full_name || '');
  const [nickname, setNickname] = useState(data.profile.nickname || '');
  const [bio, setBio] = useState(data.profile.bio || userDetails?.bio || '');
  const [timezone, setTimezone] = useState(data.profile.timezone || userDetails?.timezone || 'UTC');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Auto-detect and set timezone if it's the default value
    if (timezone === 'UTC') {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTimezone) {
        setTimezone(detectedTimezone);
      }
    }
  }, []); // Run only once on mount

  useEffect(() => {
    const isValid = fullName.trim().length > 0;
    onValidationChange(isValid);
  }, [fullName, onValidationChange]);

  useEffect(() => {
    updateData({ profile: { fullName, nickname, bio, timezone } });
  }, [fullName, nickname, bio, timezone, updateData]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await apiClient.patch('/api/v1/users/me', { full_name: fullName, nickname, bio, timezone });
      toast.success('Profile saved!');
      await refetchUserDetails();
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Profile</h2>
        <p className="text-lg text-gray-600">Let your partner know who you are and personalize your account.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Full Name *</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your Full Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Nickname (Optional)</label>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g., Alex, Johnny"
          />
          <p className="text-xs text-gray-500 mt-1 text-left">This is the name your partner will see in the app.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Bio (Optional)</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short bio about yourself (e.g., 'Fitness enthusiast & dog lover')"
            rows={3}
            className="resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Timezone</label>
          <Input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g., UTC, America/New_York"
          />
          <p className="text-xs text-gray-500 mt-1 text-left">This helps with task scheduling and notifications.</p>
        </div>
      </div>

      <Button onClick={handleSaveProfile} disabled={isSaving || fullName.trim().length === 0} className="w-full">
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
        Save Profile & Continue
      </Button>
    </motion.div>
  );
}
