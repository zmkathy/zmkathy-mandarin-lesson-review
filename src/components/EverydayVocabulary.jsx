import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, EyeOff, RotateCcw, Search, Volume2 } from "lucide-react";

const STORAGE_KEY = "mis-mandarin-everyday-vocabulary-progress-v1";
const IMAGE_ROOT = `${import.meta.env.BASE_URL}images/everyday-vocabulary`;
const AUDIO_ROOT = `${import.meta.env.BASE_URL}audio/everyday-vocabulary`;

const categories = [
  ["all", "All"],
  ["family", "Family"],
  ["food", "Food & Drinks"],
  ["feelings", "Feelings"],
  ["items", "Daily Items"]
];

const vocabulary = [
  { id: "baba", category: "family", pinyin: "bàba", hanzi: "爸爸", english: "dad" },
  { id: "mama", category: "family", pinyin: "māma", hanzi: "妈妈", english: "mom" },
  { id: "yeye", category: "family", pinyin: "yéye", hanzi: "爷爷", english: "grandpa", hasAudio: false },
  { id: "nainai", category: "family", pinyin: "nǎinai", hanzi: "奶奶", english: "grandma", hasAudio: false },
  { id: "gege", category: "family", pinyin: "gēge", hanzi: "哥哥", english: "older brother", sprite: [0, 0] },
  { id: "jiejie", category: "family", pinyin: "jiějie", hanzi: "姐姐", english: "older sister", sprite: [1, 0] },
  { id: "didi", category: "family", pinyin: "dìdi", hanzi: "弟弟", english: "younger brother", sprite: [2, 0] },
  { id: "meimei", category: "family", pinyin: "mèimei", hanzi: "妹妹", english: "younger sister", sprite: [0, 1] },
  { id: "pingguo", category: "food", pinyin: "píngguǒ", hanzi: "苹果", english: "apple" },
  { id: "shui", category: "food", pinyin: "shuǐ", hanzi: "水", english: "water" },
  { id: "cha", category: "food", pinyin: "chá", hanzi: "茶", english: "tea" },
  { id: "kafei", category: "food", pinyin: "kāfēi", hanzi: "咖啡", english: "coffee" },
  { id: "mifan", category: "food", pinyin: "mǐfàn", hanzi: "米饭", english: "cooked rice" },
  { id: "miantiao", category: "food", pinyin: "miàntiáo", hanzi: "面条", english: "noodles" },
  { id: "jiaozi", category: "food", pinyin: "jiǎozi", hanzi: "饺子", english: "dumplings" },
  { id: "baozi", category: "food", pinyin: "bāozi", hanzi: "包子", english: "steamed bun" },
  { id: "mianbao", category: "food", pinyin: "miànbāo", hanzi: "面包", english: "bread" },
  { id: "jidan", category: "food", pinyin: "jīdàn", hanzi: "鸡蛋", english: "egg" },
  { id: "e", category: "feelings", pinyin: "è", hanzi: "饿", english: "hungry", sprite: [1, 1] },
  { id: "ke", category: "feelings", pinyin: "kě", hanzi: "渴", english: "thirsty", sprite: [2, 1] },
  { id: "lei", category: "feelings", pinyin: "lèi", hanzi: "累", english: "tired", sprite: [0, 2] },
  { id: "kun", category: "feelings", pinyin: "kùn", hanzi: "困", english: "sleepy", sprite: [1, 2] },
  { id: "beizi", category: "items", pinyin: "bēizi", hanzi: "杯子", english: "cup" },
  { id: "kuaizi", category: "items", pinyin: "kuàizi", hanzi: "筷子", english: "chopsticks" },
  { id: "caidan", category: "items", pinyin: "càidān", hanzi: "菜单", english: "menu" },
  { id: "chepiao", category: "items", pinyin: "chēpiào", hanzi: "车票", english: "transport ticket" }
];

function loadProgress() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function CardImage({ item }) {
  if (item.sprite) {
    const [column, row] = item.sprite;
    return (
      <span className="everyday-card-image everyday-card-sprite" aria-hidden="true">
        <img
          src={`${IMAGE_ROOT}/people-states-sprite.webp`}
          alt=""
          style={{ left: `${column * -100}%`, top: `${row * -100}%` }}
        />
      </span>
    );
  }

  return (
    <span className="everyday-card-image">
      <img src={`${IMAGE_ROOT}/${item.id}.webp`} alt="" />
    </span>
  );
}

export default function EverydayVocabulary() {
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const [progress, setProgress] = useState(loadProgress);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Practice still works when browser storage is unavailable.
    }
  }, [progress]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const visibleVocabulary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return vocabulary.filter((item) => {
      const itemStatus = progress[item.id];
      const matchesCategory = category === "all" || item.category === category;
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "unmarked" && !itemStatus)
        || itemStatus === statusFilter;
      const matchesQuery = !normalizedQuery
        || `${item.pinyin} ${item.hanzi} ${item.english}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesStatus && matchesQuery;
    });
  }, [category, progress, query, statusFilter]);

  function toggleCard(id) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function markItem(id, status) {
    setProgress((current) => ({ ...current, [id]: status }));
  }

  function resetProgress() {
    if (window.confirm("Reset all saved everyday vocabulary progress on this device?")) {
      setProgress({});
    }
  }

  function playAudio(item) {
    audioRef.current?.pause();
    const audio = new Audio(`${AUDIO_ROOT}/${item.id}.mp3`);
    audioRef.current = audio;
    setPlayingId(item.id);
    audio.addEventListener("ended", () => setPlayingId(null), { once: true });
    audio.addEventListener("error", () => setPlayingId(null), { once: true });
    audio.play().catch(() => setPlayingId(null));
  }

  const markedCount = Object.keys(progress).length;

  return (
    <section className="everyday-vocabulary" aria-labelledby="everyday-vocabulary-title">
      <div className="section-heading practice-heading">
        <div>
          <p className="section-label">Picture flashcards</p>
          <h2 id="everyday-vocabulary-title">Everyday Vocabulary</h2>
        </div>
        <span className="result-count">{visibleVocabulary.length} words</span>
      </div>

      <div className="category-filter" aria-label="Vocabulary categories">
        {categories.map(([value, label]) => (
          <button
            className={category === value ? "is-active" : ""}
            type="button"
            onClick={() => setCategory(value)}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="everyday-toolbar">
        <label className="filter-field">
          <span>Practice set</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All words</option>
            <option value="review">Review again</option>
            <option value="unmarked">Not marked</option>
            <option value="known">Know it</option>
          </select>
        </label>

        <label className="practice-search">
          <span>Search</span>
          <span className="search-input-wrap">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Pinyin, Chinese, or English" />
          </span>
        </label>

        <label className="answer-toggle">
          <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />
          <span>
            {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
            {showAll ? "Hide answers" : "Show answers"}
          </span>
        </label>
      </div>

      <div className="progress-note" aria-live="polite">
        <span>Progress is saved on this device · {markedCount} marked</span>
        {markedCount > 0 ? (
          <button type="button" onClick={resetProgress}><RotateCcw size={15} /> Reset progress</button>
        ) : null}
      </div>

      {visibleVocabulary.length > 0 ? (
        <div className="everyday-grid">
          {visibleVocabulary.map((item) => {
            const isRevealed = showAll || revealed.has(item.id);
            const itemStatus = progress[item.id];
            return (
              <article className={`everyday-card${isRevealed ? " is-revealed" : ""}${itemStatus ? ` is-${itemStatus}` : ""}`} key={item.id}>
                <div className="everyday-image-wrap">
                  <CardImage item={item} />
                  {item.hasAudio !== false ? (
                    <button
                      className={`everyday-audio-button${playingId === item.id ? " is-playing" : ""}`}
                      type="button"
                      onClick={() => playAudio(item)}
                      aria-label={`Play ${item.pinyin}`}
                      title={`Play ${item.pinyin}`}
                    >
                      <Volume2 size={19} />
                    </button>
                  ) : null}
                </div>

                <button className="everyday-card-main" type="button" onClick={() => toggleCard(item.id)} aria-expanded={isRevealed}>
                  <span className="everyday-pinyin">{item.pinyin}</span>
                  {isRevealed ? (
                    <span className="everyday-answer">
                      <span>{item.hanzi}</span>
                      <small>{item.english}</small>
                    </span>
                  ) : (
                    <span className="everyday-reveal"><Eye size={16} /> Reveal meaning</span>
                  )}
                </button>

                <div className="mastery-actions" aria-label={`Progress for ${item.pinyin}`}>
                  <button className={itemStatus === "known" ? "is-active" : ""} type="button" onClick={() => markItem(item.id, "known")}>
                    <Check size={15} /> Know it
                  </button>
                  <button className={itemStatus === "review" ? "is-active" : ""} type="button" onClick={() => markItem(item.id, "review")}>
                    <RotateCcw size={15} /> Review again
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No vocabulary matches these filters.</p>
      )}
    </section>
  );
}
