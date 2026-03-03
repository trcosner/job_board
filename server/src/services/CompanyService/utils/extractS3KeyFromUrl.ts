/**
 * Extract S3 key from full URL
 */
export function extractS3KeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    // If URL parsing fails, assume it's already a key
    return url;
  }
}
