import { useRef } from "react";

export default function AudioVideo({ video, audio }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  return (
    <>
      <video loop ref={videoRef}>
        <source src={video} />
      </video>
      <audio loop ref={audioRef}>
        <source src={audio} />
      </audio>
      <button onClick={() => {
        videoRef.current && videoRef.current.play();
        audioRef.current && audioRef.current.play();
      }}>
        Play
      </button>
    </>
  );
}
