import { useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { speakMandarin } from "../utils/speech.js";

let activeAudio = null;

export default function SpeakButton({ text, audioSrc, className = "" }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const previousAudio = audioRef.current;

    if (!previousAudio) return undefined;

    previousAudio.pause();
    previousAudio.currentTime = 0;
    if (activeAudio === previousAudio) activeAudio = null;
    audioRef.current = null;

    return undefined;
  }, [audioSrc]);

  function playPronunciation() {
    if (!audioSrc) {
      speakMandarin(text);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
    }

    if (activeAudio && activeAudio !== audioRef.current) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }

    window.speechSynthesis?.cancel();
    activeAudio = audioRef.current;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => speakMandarin(text));
  }

  const sourceLabel = audioSrc ? "Mi's pronunciation" : "automatic pronunciation";

  return (
    <button
      className={`speak-button ${className}`.trim()}
      type="button"
      onClick={playPronunciation}
      aria-label={`Play ${sourceLabel} for ${text}`}
      title={`Play ${sourceLabel}`}
    >
      <Volume2 size={20} strokeWidth={2.3} />
    </button>
  );
}
