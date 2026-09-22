/** A non-2xx response, carrying the status so callers can tell 404 from 500. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Thin fetch wrapper for our own JSON route handlers. */
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new ApiError(`${response.status} ${response.statusText}`, response.status);
  }
  return response.json() as Promise<T>;
}

/** Server-action results are values, not throws; a mutation needs a throw to roll back. */
export class ActionFailure extends Error {}
