/** Extract the storage object path from a Supabase public photos URL. */
export function extractStoragePath(storageUrl: string): string | null {
  const publicPrefix = '/storage/v1/object/public/photos/';
  const idx = storageUrl.indexOf(publicPrefix);
  if (idx >= 0) {
    return storageUrl.slice(idx + publicPrefix.length);
  }
  const parts = storageUrl.split('/photos/');
  return parts.length > 1 ? parts[parts.length - 1] : null;
}
