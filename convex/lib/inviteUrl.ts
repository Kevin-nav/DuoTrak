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

const getAppBaseUrl = (): string => {
  const configuredBase =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL;
  if (!configuredBase) {
    return DEFAULT_LOCAL_BASE_URL;
  }
  return ensureUrlLike(configuredBase);
};

export const buildInviteUrl = (token: string): string => {
  return `${getAppBaseUrl()}/invite/${encodeURIComponent(token)}`;
};
