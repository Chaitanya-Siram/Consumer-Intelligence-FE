// Full-viewport looping video backdrop used by the "paint/ink" ProjectsScreen
// preview templates. Kept deliberately simple (single <video>, no crossfade)
// since each template mounts/unmounts its own instance on switch.
export default function PaintVideoBg({ src }) {
  return (
    <div className="paint-video-bg" aria-hidden="true">
      <video
        className="paint-video-bg-el"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className="paint-video-bg-tint" />
    </div>
  );
}
