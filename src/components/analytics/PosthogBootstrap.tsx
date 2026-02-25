"use client";

import { useEffect } from "react";
import { isPosthogConfigured } from "@/lib/analytics/posthog-client";
import { trackEvent } from "@/lib/analytics/events";

export default function PosthogBootstrap() {
  useEffect(() => {
    if (!isPosthogConfigured()) return;
    trackEvent("app_opened");
  }, []);

  return null;
}

