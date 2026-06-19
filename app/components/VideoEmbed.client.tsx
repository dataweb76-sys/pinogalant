"use client";

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export default function VideoEmbed({ url }: { url: string }) {
  const ytId = getYoutubeId(url);

  if (ytId) {
    return (
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Tour virtual</h2>
        <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: 14, overflow: "hidden", border: "1px solid #eee" }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Matterport u otro embed genérico
  if (url.startsWith("https://")) {
    return (
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Tour virtual 360°</h2>
        <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: 14, overflow: "hidden", border: "1px solid #eee" }}>
          <iframe
            src={url}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return null;
}
