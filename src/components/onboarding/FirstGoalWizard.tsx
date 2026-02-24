'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function FirstGoalWizard() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: completeOnboarding, isPending } = useMutation({
    mutationFn: () => apiClient.completePartneredOnboarding(),
    onSuccess: () => {
      toast.success('Onboarding complete!', {
        description: "You can now explore your dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    onError: (error) => {
      toast.error('An error occurred', {
        description: error.message,
      });
    },
  });

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleCreateGoal = () => {
    // Complete onboarding first, then navigate to the goal creation wizard
    completeOnboarding();
    router.push('/goals/new');
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to your partnership!</DialogTitle>
          <DialogDescription>
            You and your partner are ready to start achieving your goals together. Create your first goal now — it only takes a minute.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">AI-powered goal planning</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Choose from templates or describe your goal — we&apos;ll create a personalized plan with daily tasks.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={handleSkip} disabled={isPending}>
            Skip for now
          </Button>
          <Button onClick={handleCreateGoal} disabled={isPending}>
            {isPending ? 'Saving...' : (
              <>
                Create First Goal
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
