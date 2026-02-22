const DEFAULT_LOCAL_BASE_URL = "http://localhost:3000";

const ensureUrlLike = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return DEFAULT_LOCAL_BASE_URL;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const getPublicAppBaseUrl = (): string => {
  const explicitPublicBase = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitPublicBase) {
    return ensureUrlLike(explicitPublicBase);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  const serverBase =
    process.env.APP_URL || process.env.SITE_URL || process.env.VERCEL_URL;
  if (serverBase) {
    return ensureUrlLike(serverBase);
  }

  return DEFAULT_LOCAL_BASE_URL;
};

export const buildInviteUrl = (token: string): string => {
  const base = getPublicAppBaseUrl();
  return `${base}/invite/${encodeURIComponent(token)}`;
};

export const getInviteHostLabel = (): string => {
  try {
    return new URL(getPublicAppBaseUrl()).host;
  } catch {
    return "duotrak.app";
  }
};
