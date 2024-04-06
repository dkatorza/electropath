import { randomBytes } from 'crypto';

export function generateUniqueId(path: string) {
  const sanitizedPath = path.replace(/\W+/g, '-');
  const timestamp = Date.now();
  const hexRandomSegment = randomBytes(6).toString('hex');

  return `window-${sanitizedPath}-${timestamp}-${hexRandomSegment}`;
}
