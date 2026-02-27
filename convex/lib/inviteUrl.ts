const DEFAULT_LOCAL_BASE_URL = "http://localhost:3000";
const DEFAULT_PRODUCTION_BASE_URL = "https://duotrak.org";

const getDefaultBaseUrl = (): string => {
  return process.env.NODE_ENV === "development"
    ? DEFAULT_LOCAL_BASE_URL
    : DEFAULT_PRODUCTION_BASE_URL;
};

const ensureUrlLike = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return getDefaultBaseUrl();
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
    return getDefaultBaseUrl();
  }
  return ensureUrlLike(configuredBase);
};

export const buildInviteUrl = (token: string): string => {
  return `${getAppBaseUrl()}/invite/${encodeURIComponent(token)}`;
};
