"use client";

import Link from "next/link";

export default function RowActions({
  id,
  isPublished,
  next,
  canDelete,
  onTogglePublish,
  onDelete,
}: {
  id: string;
  isPublished: boolean;
  next: string;
  canDelete: boolean;
  onTogglePublish: (fd: FormData) => void;
  onDelete: (fd: FormData) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <form action={onTogglePublish}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="publish" value={isPublished ? "0" : "1"} />
        <button className="btn" type="submit">
          {isPublished ? "Despublicar" : "Publicar"}
        </button>
      </form>

      <Link className="btn" href={`/admin/propiedades/${id}`}>
        Editar
      </Link>

      {canDelete ? (
        <form
          action={onDelete}
          onSubmit={(e) => {
            if (!confirm("¿Eliminar propiedad? Esto no se puede deshacer.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button className="btn" type="submit">
            Eliminar
          </button>
        </form>
      ) : null}
    </div>
  );
}
