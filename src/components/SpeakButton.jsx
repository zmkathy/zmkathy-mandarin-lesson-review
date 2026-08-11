import { Volume2 } from "lucide-react";
import { speakMandarin } from "../utils/speech.js";

export default function SpeakButton({ text, label = "Play pronunciation" }) {
  return (
    <button className="speak-button" type="button" onClick={() => speakMandarin(text)} aria-label={label}>
      <Volume2 size={20} strokeWidth={2.3} />
    </button>
  );
}
