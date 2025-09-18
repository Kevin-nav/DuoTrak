'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Shield, Clock, Palette, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';

interface PreferencesStepProps {
  data: any;
  updateData: (updates: any) => void;
  onValidationChange: (isValid: boolean) => void;
  onComplete: () => void;
}

export default function PreferencesStep({ data, updateData, onValidationChange, onComplete }: PreferencesStepProps) {
  const { userDetails, refetchUserDetails } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(data.preferences.notifications || userDetails?.notifications_enabled || true);
  const [notificationTime, setNotificationTime] = useState(data.preferences.notificationTime || 'morning');
  const [theme, setTheme] = useState(data.preferences.theme || 'system');
  const [privacy, setPrivacy] = useState(data.preferences.privacy || 'partner-only');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    onValidationChange(true); // Preferences step is always valid
  }, [onValidationChange]);

  useEffect(() => {
    updateData({ preferences: { notifications: notificationsEnabled, notificationTime, theme, privacy } });
  }, [notificationsEnabled, notificationTime, theme, privacy, updateData]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await apiClient.patch('/api/v1/users/me', {
        notifications_enabled: notificationsEnabled,
        notification_time: notificationTime,
        theme: theme,
        privacy_setting: privacy,
      });
      toast.success('Preferences saved!');
      await refetchUserDetails();
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center"
        >
          <Palette className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Experience</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Let's set up your preferences to make DuoTrak work perfectly for you
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable notifications</p>
                <p className="text-sm text-gray-500">Get reminders and updates from your partner</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                disabled={isSaving}
              />
            </div>
            
            {notificationsEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Preferred notification time
                  </label>
                  <Select
                    value={notificationTime}
                    onValueChange={setNotificationTime}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8:00 AM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (2:00 PM)</SelectItem>
                      <SelectItem value="evening">Evening (6:00 PM)</SelectItem>
                      <SelectItem value="custom">Custom time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Choose your preferred theme</p>
              <div className="grid grid-cols-3 gap-3">
                {[{
                  id: "light",
                  name: "Light",
                  icon: Sun
                },
                {
                  id: "dark",
                  name: "Dark",
                  icon: Moon
                },
                {
                  id: "system",
                  name: "System",
                  icon: Clock
                },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      disabled={isSaving}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        theme === t.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">{t.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Privacy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Who can see your goals and progress?</p>
              <Select
                value={privacy}
                onValueChange={setPrivacy}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner-only">Partner only</SelectItem>
                  <SelectItem value="friends">Partner and friends</SelectItem>
                  <SelectItem value="public">Public (leaderboards)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-6">
        <Button onClick={handleSavePreferences} disabled={isSaving} size="lg" className="px-8">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Save Preferences & Continue
        </Button>
      </div>
    </motion.div>
  );
}
