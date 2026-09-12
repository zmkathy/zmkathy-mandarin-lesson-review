import { Volume2 } from "lucide-react";
import { speakMandarin } from "../utils/speech.js";

export default function SpeakButton({ text }) {
  return (
    <button
      className="speak-button"
      type="button"
      onClick={() => speakMandarin(text)}
      aria-label={`Play automatic pronunciation for ${text}`}
      title="Play automatic pronunciation"
    >
      <Volume2 size={20} strokeWidth={2.3} />
    </button>
  );
}
