import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicarPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/publicar");
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Publicar propiedad</h1>
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            Tu publicación queda en revisión hasta que un agente la apruebe.
          </div>
        </div>

        <Link className="btn" href="/">
          Volver
        </Link>
      </div>

      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 900 }}>Formulario (placeholder)</div>
        <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
          Acá mantenemos tu flujo actual. En el siguiente paso conectamos “en revisión” y aviso a Admin.
        </div>

        <div className="small" style={{ opacity: 0.7, marginTop: 12 }}>
          Usuario logueado: <b>{user.email}</b>
        </div>
      </section>
    </main>
  );
}
