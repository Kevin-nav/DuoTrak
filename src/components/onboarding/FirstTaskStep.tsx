'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckSquare, Clock, Camera, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface FirstTaskStepProps {
  data: {
    firstTask: {
      title: string;
      description: string;
      scheduledTime: string;
      requiresVerification: boolean;
    };
    goalTitle: string;
  };
  updateData: (updates: any) => void;
  onValidationChange: (isValid: boolean) => void;
}

const TASK_SUGGESTIONS = [
  "Write down 3 specific action steps",
  "Research and bookmark 5 helpful resources",
  "Set up a dedicated workspace or area",
  "Create a simple tracking system",
  "Share your commitment with a friend",
  "Take a 'before' photo or measurement",
  "Schedule time blocks in your calendar",
  "Gather necessary tools or materials",
];

export default function FirstTaskStep({ data, updateData, onValidationChange }: FirstTaskStepProps) {
  const [taskTitle, setTaskTitle] = useState(data.firstTask?.title || "");
  const [taskDescription, setTaskDescription] = useState(data.firstTask?.description || "");
  const [scheduledTime, setScheduledTime] = useState(data.firstTask?.scheduledTime || "");
  const [requiresVerification, setRequiresVerification] = useState(data.firstTask?.requiresVerification || false);

  const getDefaultTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!scheduledTime) {
      setScheduledTime(getDefaultTime());
    }
  }, [scheduledTime]);

  useEffect(() => {
    const isValid = taskTitle.trim().length >= 3 && taskDescription.trim().length >= 5;
    onValidationChange(isValid);
  }, [taskTitle, taskDescription, onValidationChange]);

  useEffect(() => {
    updateData({
      firstTask: {
        title: taskTitle,
        description: taskDescription,
        scheduledTime,
        requiresVerification,
      },
    });
  }, [taskTitle, taskDescription, scheduledTime, requiresVerification, updateData]);

  const applySuggestion = (suggestion: string) => {
    setTaskTitle(suggestion);
    setTaskDescription(`Complete this task as the first step toward achieving "${data.goalTitle}".`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <CheckSquare className="w-8 h-8 text-blue-500" />
          <h2 className="text-3xl font-bold text-gray-900">Create Your First Task</h2>
        </div>
        <p className="text-lg text-gray-600">Every big goal starts with a small step. Let's create your first task!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Task Ideas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TASK_SUGGESTIONS.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => applySuggestion(suggestion)}
                className="text-left p-2 bg-white rounded-lg text-sm text-blue-800 hover:bg-blue-100 transition-colors border border-blue-200"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g., Write down 3 specific action steps"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Task Description *</label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe what needs to be done and any specific requirements..."
            rows={3}
            className="resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">When would you like to do this?</label>
          <Input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-gray-500 mt-1">Choose a realistic time when you can focus on this task</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-gray-600" />
            <div>
              <h4 className="font-medium text-gray-900">Require Photo Verification</h4>
              <p className="text-sm text-gray-600">Ask your partner to verify completion with a photo</p>
            </div>
          </div>
          <Switch checked={requiresVerification} onCheckedChange={setRequiresVerification} />
        </div>

        {taskTitle && taskDescription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 rounded-xl p-4 border border-green-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-800">Task Preview</span>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{taskTitle}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(scheduledTime).toLocaleDateString()} at{" "}
                  {new Date(scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">{taskDescription}</p>
              {requiresVerification && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Camera className="w-3 h-3" />
                  Photo verification required
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
