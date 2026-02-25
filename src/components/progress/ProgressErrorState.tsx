"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ProgressErrorStateProps = {
  onRetry: () => void;
};

export default function ProgressErrorState({ onRetry }: ProgressErrorStateProps) {
  return (
    <Alert variant="destructive" className="space-y-3">
      <AlertTitle>Could not load progress data</AlertTitle>
      <AlertDescription>
        Something went wrong while loading analytics. Try again, and if this keeps happening, refresh the page.
      </AlertDescription>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </Alert>
  );
}

