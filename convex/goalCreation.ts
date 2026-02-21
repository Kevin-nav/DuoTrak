type JsonRecord = Record<string, unknown>;

const DEFAULT_BACKEND_URL = "https://localhost:8000";

const toSnakeCase = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(toSnakeCase);
  }
  if (value !== null && typeof value === "object" && value.constructor === Object) {
    return Object.entries(value as JsonRecord).reduce<JsonRecord>((acc, [key, nestedValue]) => {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      acc[snakeKey] = toSnakeCase(nestedValue);
      return acc;
    }, {});
  }
  return value;
};

const toCamelCase = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(toCamelCase);
  }
  if (value !== null && typeof value === "object" && value.constructor === Object) {
    return Object.entries(value as JsonRecord).reduce<JsonRecord>((acc, [key, nestedValue]) => {
      const camelKey = key.replace(/(_\w)/g, (match) => match[1].toUpperCase());
      acc[camelKey] = toCamelCase(nestedValue);
      return acc;
    }, {});
  }
  return value;
};

const getBackendUrl = () => process.env.FASTAPI_URL || DEFAULT_BACKEND_URL;

export const postGoalCreation = async <TResponse>(
  endpoint: string,
  payload: JsonRecord,
): Promise<TResponse> => {
  const response = await fetch(`${getBackendUrl()}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toSnakeCase(payload)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend returned ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as unknown;
  return toCamelCase(data) as TResponse;
};

export const postGoalCreationRaw = async <TResponse>(
  endpoint: string,
  payload: JsonRecord,
): Promise<TResponse> => {
  const response = await fetch(`${getBackendUrl()}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend returned ${response.status}: ${errorText}`);
  }

  return (await response.json()) as TResponse;
};
