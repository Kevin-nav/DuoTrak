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
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function FirstGoalWizard() {
  const queryClient = useQueryClient();

  const { mutate: completeOnboarding, isPending } = useMutation({
    mutationFn: () => apiClient.completePartneredOnboarding(),
    onSuccess: () => {
      toast.success('Onboarding complete!', {
        description: "You can now explore your dashboard.",
      });
      // Refetch user data to update status and close the wizard
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
    // For now, creating a goal will also complete the onboarding.
    // In the future, this would open a goal creation form.
    completeOnboarding();
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to your partnership!</DialogTitle>
          <DialogDescription>
            You and your partner are ready to start achieving your goals together. Create your first shared goal now.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Placeholder for a future goal creation form */}
          <p className="text-center text-stone-gray">
            (A simplified goal creation form will go here)
          </p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={handleSkip} disabled={isPending}>
            Skip for now
          </Button>
          <Button onClick={handleCreateGoal} disabled={isPending}>
            {isPending ? 'Saving...' : 'Create First Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
