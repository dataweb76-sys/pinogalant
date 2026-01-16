import { signOutAction } from "@/app/auth/actions";

export default function LogoutPage() {
  return (
    <form action={signOutAction} style={{ padding: 24 }}>
      <h1>Cerrar sesión</h1>
      <button type="submit">Salir</button>
    </form>
  );
}
