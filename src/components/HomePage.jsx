import { ArrowRight, AudioLines, BookOpen } from "lucide-react";

export default function HomePage({ lessons, onNavigate, loadError }) {
  const totalItems = lessons.reduce(
    (total, lesson) => total + lesson.vocabulary.length + lesson.sentences.length,
    0
  );

  return (
    <main className="content-page hub-page">
      <header className="hub-intro">
        <div className="hub-heading">
          <h1>
            <span>Mi's Mandarin</span>
            <span className="hub-title-accent">Learning Hub</span>
          </h1>
          <p>Lessons, pronunciation, and practice activities in one place.</p>
        </div>
      </header>

      {loadError ? <p className="content-note">{loadError}</p> : null}

      <section className="hub-section" aria-labelledby="start-learning-title">
        <div className="section-heading">
          <div>
            <p className="section-label">Study tools</p>
            <h2 id="start-learning-title">Explore &amp; Practice</h2>
          </div>
        </div>
        <div className="resource-grid">
          <button className="resource-card resource-lessons" type="button" onClick={() => onNavigate("course")}>
            <span className="resource-icon"><BookOpen size={25} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Beginner level</span>
              <strong>Beginner Course</strong>
              <span>Review vocabulary and useful sentences from every class.</span>
              <small>{lessons.length} lessons · {totalItems} review items</small>
            </span>
            <ArrowRight className="resource-arrow" size={23} />
          </button>

          <button className="resource-card resource-pinyin" type="button" onClick={() => onNavigate("pinyin")}>
            <span className="resource-icon"><AudioLines size={26} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Pronunciation</span>
              <strong>Pinyin Chart</strong>
              <span>Explore initials, finals, complete syllables, and four tones.</span>
              <small>403 sounds · Tone Perfect FV2 audio</small>
            </span>
            <ArrowRight className="resource-arrow" size={23} />
          </button>
        </div>
      </section>
    </main>
  );
}
