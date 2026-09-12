import { AudioLines, BookOpen, House } from "lucide-react";

export default function SiteHeader({ activeView, onNavigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => onNavigate("home")}>
        <span className="brand-mark" aria-label="Mì">Mì</span>
        <span className="brand-copy"><strong>Mi's Mandarin</strong><small>Learning Hub</small></span>
      </button>
      <nav className="primary-nav" aria-label="Main navigation">
        <button className={activeView === "home" ? "is-active" : ""} type="button" onClick={() => onNavigate("home")}>
          <House size={18} /> Home
        </button>
        <button className={activeView === "course" ? "is-active" : ""} type="button" onClick={() => onNavigate("course")}>
          <BookOpen size={18} /> Beginner Course
        </button>
        <button className={activeView === "pinyin" ? "is-active" : ""} type="button" onClick={() => onNavigate("pinyin")}>
          <AudioLines size={18} /> Pinyin Chart
        </button>
      </nav>
    </header>
  );
}
