import type { ReactNode } from 'react';

interface FlowActionBarProps {
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
}

export default function FlowActionBar({ primary, secondary, tertiary }: FlowActionBarProps) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>{tertiary}</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {secondary}
        {primary}
      </div>
    </div>
  );
}
