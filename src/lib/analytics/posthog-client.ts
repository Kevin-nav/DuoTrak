"use client";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

const ANON_ID_STORAGE_KEY = "duotrak_posthog_anon_id";
const USER_ID_STORAGE_KEY = "duotrak_posthog_user_id";

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getStorageValue(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage write failures
  }
}

function getAnonymousDistinctId() {
  let anonId = getStorageValue(ANON_ID_STORAGE_KEY);
  if (!anonId) {
    anonId = randomId();
    setStorageValue(ANON_ID_STORAGE_KEY, anonId);
  }
  return anonId;
}

export function getDistinctId() {
  return getStorageValue(USER_ID_STORAGE_KEY) || getAnonymousDistinctId();
}

export async function capturePosthogEvent(
  event: string,
  properties: Record<string, unknown> = {},
) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;

  const payload = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: getDistinctId(),
    properties: {
      $lib: "duotrak-web",
      $current_url: window.location.href,
      ...properties,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // ignore analytics network failures
  }
}

export async function identifyPosthogUser(userId: string) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;

  const anonDistinctId = getAnonymousDistinctId();
  const currentUserId = getStorageValue(USER_ID_STORAGE_KEY);
  if (currentUserId === userId) return;

  setStorageValue(USER_ID_STORAGE_KEY, userId);

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "$identify",
        distinct_id: userId,
        properties: {
          distinct_id: userId,
          $anon_distinct_id: anonDistinctId,
          $lib: "duotrak-web",
        },
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    });
  } catch {
    // ignore analytics network failures
  }
}

export function isPosthogConfigured() {
  return Boolean(POSTHOG_KEY);
}

