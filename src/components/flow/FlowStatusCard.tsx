import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type FlowStatusTone = 'loading' | 'success' | 'warning';

interface FlowStatusCardProps {
  title: string;
  description: string;
  tone?: FlowStatusTone;
  actions?: ReactNode;
}

export default function FlowStatusCard({ title, description, tone = 'loading', actions }: FlowStatusCardProps) {
  const icon =
    tone === 'success' ? (
      <CheckCircle2 className="h-5 w-5 text-landing-sage" />
    ) : tone === 'warning' ? (
      <AlertCircle className="h-5 w-5 text-landing-terracotta" />
    ) : (
      <Loader2 className="h-5 w-5 animate-spin text-landing-terracotta" />
    );

  return (
    <article className="rounded-xl border border-landing-clay/70 bg-landing-cream/60 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-landing-espresso">{title}</h3>
          <p className="text-sm leading-relaxed text-landing-espresso-light">{description}</p>
        </div>
      </div>
      {actions ? <div className="mt-4">{actions}</div> : null}
    </article>
  );
}
