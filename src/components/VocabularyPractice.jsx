import { useMemo, useState } from "react";
import { Eye, EyeOff, Search, Shuffle } from "lucide-react";

function collectVocabulary(lessons) {
  const uniqueItems = new Map();

  lessons.forEach((lesson, lessonIndex) => {
    lesson.vocabulary.forEach((item, itemIndex) => {
      const key = `${item.hanzi}-${item.pinyin}`;
      const existing = uniqueItems.get(key);

      if (existing) {
        existing.lessonNumbers.push(lessonIndex + 1);
        return;
      }

      uniqueItems.set(key, {
        ...item,
        id: `${lesson.id}-${itemIndex}`,
        lessonNumbers: [lessonIndex + 1]
      });
    });
  });

  return [...uniqueItems.values()];
}

function shuffleItems(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export default function VocabularyPractice({ lessons }) {
  const [lessonFilter, setLessonFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const vocabulary = useMemo(() => collectVocabulary(lessons), [lessons]);

  const visibleVocabulary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = vocabulary.filter((item) => {
      const matchesLesson = lessonFilter === "all"
        || item.lessonNumbers.includes(Number(lessonFilter));
      const matchesQuery = !normalizedQuery
        || `${item.hanzi} ${item.pinyin} ${item.english}`.toLowerCase().includes(normalizedQuery);
      return matchesLesson && matchesQuery;
    });

    if (shuffleVersion === 0) return filtered;
    return shuffleItems(filtered);
  }, [lessonFilter, query, shuffleVersion, vocabulary]);

  function toggleCard(id) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="vocabulary-practice" aria-labelledby="vocabulary-practice-title">
      <div className="section-heading practice-heading">
        <div>
          <p className="section-label">Beginner course</p>
          <h2 id="vocabulary-practice-title">Vocabulary Practice</h2>
        </div>
        <span className="result-count">{visibleVocabulary.length} words</span>
      </div>

      <div className="practice-toolbar">
        <label className="filter-field">
          <span>Lesson</span>
          <select value={lessonFilter} onChange={(event) => setLessonFilter(event.target.value)}>
            <option value="all">All lessons</option>
            {lessons.map((lesson, index) => (
              <option value={index + 1} key={lesson.id}>Lesson {index + 1}: {lesson.title}</option>
            ))}
          </select>
        </label>

        <label className="practice-search">
          <span>Search</span>
          <span className="search-input-wrap">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Chinese, Pinyin, or English" />
          </span>
        </label>

        <button className="toolbar-button" type="button" onClick={() => setShuffleVersion((value) => value + 1)}>
          <Shuffle size={18} /> Shuffle
        </button>

        <label className="answer-toggle">
          <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />
          <span>
            {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
            {showAll ? "Hide answers" : "Show answers"}
          </span>
        </label>
      </div>

      {visibleVocabulary.length > 0 ? (
        <div className="practice-grid">
          {visibleVocabulary.map((item) => {
            const isRevealed = showAll || revealed.has(item.id);
            return (
              <button
                className={`practice-card${isRevealed ? " is-revealed" : ""}`}
                type="button"
                key={item.id}
                onClick={() => toggleCard(item.id)}
                aria-expanded={isRevealed}
              >
                <span className="practice-card-top">
                  <small>{item.lessonNumbers.map((number) => `L${number}`).join(" · ")}</small>
                  {isRevealed ? <EyeOff size={17} /> : <Eye size={17} />}
                </span>
                <strong className="practice-pinyin">{item.pinyin}</strong>
                {isRevealed ? (
                  <span className="practice-answer">
                    <span className="practice-hanzi">{item.hanzi}</span>
                    <small>{item.english}</small>
                  </span>
                ) : (
                  <span className="practice-hidden">•••</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No vocabulary matches these filters.</p>
      )}
    </section>
  );
}
