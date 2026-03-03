/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : '';
}
