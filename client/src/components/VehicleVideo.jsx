function getYoutubeEmbedUrl(url) {
  if (typeof url !== "string" || !url) {
    return "";
  }

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);

  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  const fullMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);

  if (fullMatch) {
    return `https://www.youtube.com/embed/${fullMatch[1]}`;
  }

  return "";
}

function VehicleVideo({ src, title }) {
  const youtubeEmbedUrl = getYoutubeEmbedUrl(src);

  if (!src) {
    return null;
  }

  if (youtubeEmbedUrl) {
    return (
      <div className="vehicle-video-frame">
        <iframe
          src={youtubeEmbedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video className="vehicle-video-player" controls preload="metadata">
      <source src={src} />
    </video>
  );
}

export default VehicleVideo;
