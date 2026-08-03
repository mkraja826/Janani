type ErrorLike = {
  context?: unknown;
  message?: string;
  name?: string;
  status?: number;
};

export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const value = error as ErrorLike;
  const contextStatus = typeof value.context === 'object'
    && value.context !== null
    && 'status' in value.context
    && typeof value.context.status === 'number'
    ? value.context.status
    : undefined;
  const status = typeof value.status === 'number' ? value.status : contextStatus;
  if (typeof status === 'number') {
    return status === 408 || status === 429 || status >= 500;
  }
  const text = `${value.name ?? ''} ${value.message ?? String(error)}`.toLowerCase();
  return /abort|connection|fetch|network|offline|socket|temporar|timeout|timed out/.test(text);
}
