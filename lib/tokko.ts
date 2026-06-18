const API_KEY = process.env.TOKKO_API_KEY!;
const BASE = "https://www.tokkobroker.com/api/v1";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type TokkoPhoto = {
  image: string;
  thumb: string;
  original: string;
  is_front_cover: boolean;
  order: number;
};

export type TokkoProperty = {
  id: number;
  address: string;
  description: string;
  geo_lat: string;
  geo_long: string;
  bathroom_amount: number;
  rooms_amount?: number;
  suite_amount?: number;
  parking_lot_amount?: number;
  total_surface?: string;
  roofed_surface?: string;
  photos: TokkoPhoto[];
  location: {
    full_location: string;
    short_location: string;
    name: string;
  };
  type: { id: number; name: string; code: string };
  operations: Array<{
    operation_type: string; // "Sale" | "Rent"
    prices: Array<{ currency: string; price: number }>;
  }>;
  producer?: {
    id: number;
    name: string;
    email: string;
    cellphone: string;
    phone: string;
    picture: string;
    position: string;
  };
  tags?: Array<{ id: number; name: string }>;
};

type TokkoListResponse = {
  meta: { total_count: number; limit: number; offset: number };
  objects: TokkoProperty[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function tokkoPrice(p: TokkoProperty): { amount: number; currency: string } | null {
  const prices = p.operations?.[0]?.prices;
  if (!prices?.length) return null;
  return { amount: prices[0].price, currency: prices[0].currency };
}

export function tokkoOperation(p: TokkoProperty): "venta" | "alquiler" | string {
  const op = p.operations?.[0]?.operation_type ?? "";
  if (op === "Sale") return "venta";
  if (op === "Rent") return "alquiler";
  return op.toLowerCase();
}

export function tokkoCover(p: TokkoProperty): string | null {
  if (!p.photos?.length) return null;
  const cover = p.photos.find((ph) => ph.is_front_cover) ?? p.photos[0];
  return cover?.image ?? null;
}

export function tokkoType(p: TokkoProperty): string {
  const name = p.type?.name ?? "";
  const map: Record<string, string> = {
    House: "Casa",
    Apartment: "Departamento",
    Land: "Terreno",
    "Commercial Premises": "Local",
    Office: "Oficina",
    "Country House": "Campo",
    "Weekend House": "Quinta",
    Warehouse: "Galpón",
    "Country Lot": "Lote",
    PH: "PH",
  };
  return map[name] ?? name;
}

export function tokkoLocation(p: TokkoProperty): { city: string; neighborhood: string } {
  const parts = (p.location?.short_location ?? "").split("|").map((s) => s.trim());
  return {
    city: parts[1] ?? parts[0] ?? "",
    neighborhood: parts[2] ?? "",
  };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}/`);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("format", "json");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Tokko API error ${res.status}`);
  return res.json();
}

// ─── API pública ──────────────────────────────────────────────────────────────
export async function getTokkoProperties(opts: {
  limit?: number;
  offset?: number;
  operation?: string; // "Sale" | "Rent"
  typeId?: string;
  search?: string;
} = {}): Promise<TokkoListResponse> {
  const params: Record<string, string> = {
    limit: String(opts.limit ?? 40),
    offset: String(opts.offset ?? 0),
  };
  if (opts.operation) params.operation_type = opts.operation;
  if (opts.typeId) params.type = opts.typeId;
  return apiFetch<TokkoListResponse>("/property", params);
}

export async function getTokkoProperty(id: string | number): Promise<TokkoProperty | null> {
  try {
    return await apiFetch<TokkoProperty>(`/property/${id}`);
  } catch {
    return null;
  }
}

// Trae TODAS las propiedades (pagina internamente)
export async function getAllTokkoProperties(): Promise<TokkoProperty[]> {
  const first = await getTokkoProperties({ limit: 40, offset: 0 });
  const total = first.meta.total_count;
  if (total <= 40) return first.objects;

  const pages = Math.ceil(total / 40);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      getTokkoProperties({ limit: 40, offset: (i + 1) * 40 })
    )
  );
  return [first.objects, ...rest.map((r) => r.objects)].flat();
}
