"use client";

export default function ProgressLoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-16 animate-pulse rounded-2xl bg-landing-cream" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-landing-cream" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-landing-cream" />
      <div className="h-64 animate-pulse rounded-2xl bg-landing-cream" />
    </div>
  );
}

