import { VolumeX } from "lucide-react";

export default function SpeakButton({ text }) {
  return (
    <button className="speak-button" type="button" disabled aria-label={`Recording for ${text} is being prepared`} title="Teacher-approved recording is being prepared">
      <VolumeX size={20} strokeWidth={2.3} />
    </button>
  );
}
