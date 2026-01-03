
/**
 * Checks a password against the HaveIBeenPwned API using k-Anonymity.
 * This sends only the first 5 characters of the SHA-1 hash of the password.
 */
export async function checkBreach(password: string): Promise<number> {
  if (!password) return 0;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) return 0;

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [lineSuffix, count] = line.split(':');
      if (lineSuffix === suffix) {
        return parseInt(count.trim(), 10);
      }
    }

    return 0;
  } catch (error) {
    console.error('HIBP Check error:', error);
    return 0;
  }
}
