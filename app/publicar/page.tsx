import PublishForm from "./publish-form";

export default function PublicarPage() {
  return (
    <div className="card">
      <h1>Publicar propiedad</h1>
      <p className="small">Formulario MVP: crea una “publicación” en estado <b>en_revision</b>.</p>
      <PublishForm />
    </div>
  );
}
