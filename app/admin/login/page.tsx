import AdminLogin from "./ui";

export default function AdminLoginPage() {
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1>Admin - Login</h1>
      <p className="small">Necesitás un usuario con rol <b>super_admin</b> o <b>admin</b>.</p>
      <AdminLogin />
    </div>
  );
}
