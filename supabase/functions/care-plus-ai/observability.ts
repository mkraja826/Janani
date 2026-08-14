export type CarePlusLogLevel = 'info' | 'warn' | 'error';

export function carePlusRequestId(request: Request): string {
  const supplied = request.headers.get('x-request-id')?.trim();
  return supplied && supplied.length <= 120 ? supplied : crypto.randomUUID();
}

export function carePlusLog(
  level: CarePlusLogLevel,
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const payload = JSON.stringify({
    service: 'care-plus-ai',
    event,
    ...fields,
  });
  if (level === 'error') console.error(payload);
  else if (level === 'warn') console.warn(payload);
  else console.log(payload);
}

export function providerErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown_error';
  const message = error.message.trim();
  if (/^[a-z0-9_\-]+$/i.test(message)) return message.slice(0, 120);
  if (/^provider_http_\d{3}$/i.test(message)) return message;
  return 'provider_error';
}
