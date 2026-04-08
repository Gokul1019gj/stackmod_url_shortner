const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += BASE62[Math.floor(Math.random() * BASE62.length)];
  }
  return code;
}

/**
 * Generates a unique short code (6 chars, expanding to 7-8 on collision).
 * Accepts a `codeExists` callback so DB access stays in the repository layer.
 */
export function generateShortCode(codeExists: (code: string) => boolean): string {
  for (let length = 6; length <= 8; length++) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode(length);
      if (!codeExists(code)) {
        return code;
      }
    }
  }
  // Extremely unlikely fallback: UUID-like long code
  return randomCode(12);
}
