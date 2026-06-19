const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUCKET = "site-assets";

function storageUrl(name: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${name}`;
}

/**
 * Devuelve la URL del asset desde Supabase Storage si existe,
 * o el fallback local si todavía no fue subido.
 */
export async function getSiteAssetUrl(name: string, fallback: string): Promise<string> {
  if (!SUPABASE_URL) return fallback;
  const url = storageUrl(name);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      next: { revalidate: 60 }, // re-check cada 60s
    });
    return res.ok ? `${url}?t=${Date.now()}` : fallback;
  } catch {
    return fallback;
  }
}

/** URL directa sin verificar (para client components después de upload) */
export function getSiteAssetUrlDirect(name: string) {
  return storageUrl(name);
}
