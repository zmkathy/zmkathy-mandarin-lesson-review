import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Eye, EyeOff, Headphones, RotateCcw, Search, Volume2, X } from "lucide-react";
import { getCardProgress, saveCardProgress } from "../services/studentPortal.js";

const STORAGE_KEY = "mis-mandarin-everyday-vocabulary-progress-v1";
const IMAGE_ROOT = `${import.meta.env.BASE_URL}images/everyday-vocabulary`;
const AUDIO_ROOT = `${import.meta.env.BASE_URL}audio/everyday-vocabulary`;
const AUDIO_VERSION = "20260917-4";

const categories = [
  ["all", "All"],
  ["family", "Family"],
  ["food", "Food & Drinks"],
  ["feelings", "Feelings"],
  ["clothing", "Clothing"],
  ["transportation", "Transportation"],
  ["tableware", "Tableware"],
  ["items", "Daily Items"],
  ["places", "Places"]
];

const vocabulary = [
  { id: "baba", category: "family", pinyin: "bàba", hanzi: "爸爸", english: "dad" },
  { id: "mama", category: "family", pinyin: "māma", hanzi: "妈妈", english: "mom" },
  { id: "yeye", category: "family", pinyin: "yéye", hanzi: "爷爷", english: "grandpa" },
  { id: "nainai", category: "family", pinyin: "nǎinai", hanzi: "奶奶", english: "grandma" },
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
  { id: "niunai", category: "food", pinyin: "niúnǎi", hanzi: "牛奶", english: "milk" },
  { id: "xiangjiao", category: "food", pinyin: "xiāngjiāo", hanzi: "香蕉", english: "banana" },
  { id: "xigua", category: "food", pinyin: "xīguā", hanzi: "西瓜", english: "watermelon" },
  { id: "chengzi", category: "food", pinyin: "chéngzi", hanzi: "橙子", english: "orange" },
  { id: "e", category: "feelings", pinyin: "è", hanzi: "饿", english: "hungry", sprite: [1, 1] },
  { id: "ke", category: "feelings", pinyin: "kě", hanzi: "渴", english: "thirsty", sprite: [2, 1] },
  { id: "lei", category: "feelings", pinyin: "lèi", hanzi: "累", english: "tired", sprite: [0, 2] },
  { id: "kun", category: "feelings", pinyin: "kùn", hanzi: "困", english: "sleepy", sprite: [1, 2] },
  { id: "yifu", category: "clothing", pinyin: "yīfu", hanzi: "衣服", english: "clothes", imageFit: "contain" },
  { id: "kuzi", category: "clothing", pinyin: "kùzi", hanzi: "裤子", english: "pants", imageFit: "contain" },
  { id: "maozi", category: "clothing", pinyin: "màozi", hanzi: "帽子", english: "hat", imageFit: "contain" },
  { id: "yanjing", category: "clothing", pinyin: "yǎnjìng", hanzi: "眼镜", english: "glasses", imageFit: "contain" },
  { id: "ditie", category: "transportation", pinyin: "dìtiě", hanzi: "地铁", english: "subway", imageFit: "contain" },
  { id: "gongjiaoche", category: "transportation", pinyin: "gōngjiāochē", hanzi: "公交车", english: "bus", imageFit: "contain" },
  { id: "zixingche", category: "transportation", pinyin: "zìxíngchē", hanzi: "自行车", english: "bicycle", imageFit: "contain" },
  { id: "feiji", category: "transportation", pinyin: "fēijī", hanzi: "飞机", english: "airplane", imageFit: "contain" },
  { id: "chuzuche", category: "transportation", pinyin: "chūzūchē", hanzi: "出租车", english: "taxi", imageFit: "contain" },
  { id: "panzi", category: "tableware", pinyin: "pánzi", hanzi: "盘子", english: "plate", imageFit: "contain" },
  { id: "wan", category: "tableware", pinyin: "wǎn", hanzi: "碗", english: "bowl", imageFit: "contain" },
  { id: "shaozi", category: "tableware", pinyin: "sháozi", hanzi: "勺子", english: "spoon", imageFit: "contain" },
  { id: "chazi", category: "tableware", pinyin: "chāzi", hanzi: "叉子", english: "fork", imageFit: "contain" },
  { id: "zhuozi", category: "items", pinyin: "zhuōzi", hanzi: "桌子", english: "table", imageFit: "contain" },
  { id: "dengzi", category: "items", pinyin: "dèngzi", hanzi: "凳子", english: "stool", imageFit: "contain" },
  { id: "yizi", category: "items", pinyin: "yǐzi", hanzi: "椅子", english: "chair", imageFit: "contain" },
  { id: "beizi", category: "items", pinyin: "bēizi", hanzi: "杯子", english: "cup" },
  { id: "wazi", category: "items", pinyin: "wàzi", hanzi: "袜子", english: "socks", imageFit: "contain" },
  { id: "xiezi", category: "items", pinyin: "xiézi", hanzi: "鞋子", english: "shoes", imageFit: "contain" },
  { id: "kuaizi", category: "items", pinyin: "kuàizi", hanzi: "筷子", english: "chopsticks" },
  { id: "caidan", category: "items", pinyin: "càidān", hanzi: "菜单", english: "menu" },
  { id: "chepiao", category: "items", pinyin: "chēpiào", hanzi: "车票", english: "transport ticket" },
  { id: "shouji", category: "items", pinyin: "shǒujī", hanzi: "手机", english: "mobile phone", imageFit: "contain" },
  { id: "qianbao", category: "items", pinyin: "qiánbāo", hanzi: "钱包", english: "wallet" },
  { id: "yaoshi", category: "items", pinyin: "yàoshi", hanzi: "钥匙", english: "keys" },
  { id: "shu", category: "items", pinyin: "shū", hanzi: "书", english: "book" },
  { id: "jia", category: "places", pinyin: "jiā", hanzi: "家", english: "home" },
  { id: "xuexiao", category: "places", pinyin: "xuéxiào", hanzi: "学校", english: "school" },
  { id: "chaoshi", category: "places", pinyin: "chāoshì", hanzi: "超市", english: "supermarket" },
  { id: "canting", category: "places", pinyin: "cāntīng", hanzi: "餐厅", english: "restaurant" }
];

function loadProgress(storageKey) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey)) || {};
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
    <span className={`everyday-card-image${item.imageFit === "contain" ? " is-contain" : ""}`}>
      <img src={`${IMAGE_ROOT}/${item.id}.webp`} alt="" />
    </span>
  );
}

function getChallengeChoices(items, activeItem, version) {
  if (!activeItem) return [];

  const alternatives = items.filter((item) => item.id !== activeItem.id);
  const seed = [...`${activeItem.id}-${version}`].reduce((total, character) => total + character.charCodeAt(0), 0);
  const picked = alternatives
    .map((item, index) => ({ item, order: (index * 19 + seed) % 101 }))
    .sort((first, second) => first.order - second.order)
    .slice(0, 3)
    .map(({ item }) => item);

  return [activeItem, ...picked]
    .map((item, index) => ({ item, order: (index * 29 + seed) % 97 }))
    .sort((first, second) => first.order - second.order)
    .map(({ item }) => item);
}

export default function EverydayVocabulary({ student, showHeading = true }) {
  const storageKey = student?.id ? `${STORAGE_KEY}-${student.id}` : STORAGE_KEY;
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const [progress, setProgress] = useState(() => loadProgress(storageKey));
  const [playingId, setPlayingId] = useState(null);
  const [view, setView] = useState("flashcards");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeAnswer, setChallengeAnswer] = useState(null);
  const [challengeScore, setChallengeScore] = useState({ correct: 0, answered: 0 });
  const [challengeVersion, setChallengeVersion] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Practice still works when browser storage is unavailable.
    }
  }, [progress, storageKey]);

  useEffect(() => {
    if (!student?.token || student.id === "demo") return;
    getCardProgress(student.token, "everyday_vocabulary").then((savedProgress) => {
      setProgress((current) => ({ ...current, ...savedProgress }));
    });
  }, [student?.id, student?.token]);

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

  const activeChallengeIndex = Math.min(challengeIndex, Math.max(visibleVocabulary.length - 1, 0));
  const activeChallengeItem = visibleVocabulary[activeChallengeIndex];
  const challengeChoices = useMemo(
    () => getChallengeChoices(vocabulary, activeChallengeItem, challengeVersion),
    [activeChallengeItem, challengeVersion]
  );

  useEffect(() => {
    setChallengeIndex(0);
    setChallengeAnswer(null);
    setChallengeScore({ correct: 0, answered: 0 });
  }, [category, query, statusFilter]);

  useEffect(() => {
    setChallengeAnswer(null);
  }, [activeChallengeItem?.id]);

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
    if (student?.token && student.id !== "demo") {
      saveCardProgress(student.token, "everyday_vocabulary", id, status);
    }
  }

  function resetProgress() {
    if (window.confirm("Reset all saved everyday vocabulary progress on this device?")) {
      setProgress({});
    }
  }

  function playAudio(item) {
    audioRef.current?.pause();
    const audio = new Audio(`${AUDIO_ROOT}/${item.id}.mp3?v=${AUDIO_VERSION}`);
    audioRef.current = audio;
    setPlayingId(item.id);
    audio.addEventListener("ended", () => setPlayingId(null), { once: true });
    audio.addEventListener("error", () => setPlayingId(null), { once: true });
    audio.play().catch(() => setPlayingId(null));
  }

  function answerChallenge(item) {
    if (!activeChallengeItem || challengeAnswer) return;
    const correct = item.id === activeChallengeItem.id;
    setChallengeAnswer({ id: item.id, correct });
    setChallengeScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      answered: current.answered + 1
    }));
  }

  function nextChallenge() {
    if (visibleVocabulary.length < 2) return;
    setChallengeIndex((current) => (current + 1) % visibleVocabulary.length);
    setChallengeVersion((current) => current + 1);
  }

  const markedCount = Object.keys(progress).length;

  return (
    <section className="everyday-vocabulary" aria-label={showHeading ? undefined : "Everyday vocabulary flashcards"} aria-labelledby={showHeading ? "everyday-vocabulary-title" : undefined}>
      {showHeading ? (
        <div className="section-heading practice-heading">
          <div>
            <p className="section-label">Picture flashcards</p>
            <h2 id="everyday-vocabulary-title">Everyday Vocabulary</h2>
          </div>
          <span className="result-count">{visibleVocabulary.length} words</span>
        </div>
      ) : null}

      <div className="practice-view-switch" role="group" aria-label="Everyday vocabulary view">
        <button className={view === "flashcards" ? "is-active" : ""} type="button" onClick={() => setView("flashcards")}>
          Flashcards
        </button>
        <button className={view === "challenge" ? "is-active" : ""} type="button" onClick={() => setView("challenge")}>
          <Headphones size={17} /> Listening challenge
        </button>
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

        {view === "flashcards" ? (
          <label className="answer-toggle">
            <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />
            <span>
              {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
              {showAll ? "Hide answers" : "Show answers"}
            </span>
          </label>
        ) : null}
      </div>

      {view === "challenge" && activeChallengeItem ? (
        <article className="everyday-challenge" aria-live="polite">
          <div className="everyday-challenge-top">
            <span>{category === "all" ? "All topics" : categories.find(([id]) => id === category)?.[1]}</span>
            <strong>{challengeScore.correct} / {challengeScore.answered} correct</strong>
          </div>
          <div className="everyday-challenge-prompt">
            <button className={`everyday-challenge-audio${playingId === activeChallengeItem.id ? " is-playing" : ""}`} type="button" onClick={() => playAudio(activeChallengeItem)} aria-label={`Play ${activeChallengeItem.pinyin}`} title="Listen again">
              <Volume2 size={24} />
            </button>
            <div>
              <p className="section-label">Listen and choose</p>
              <h3>Which picture matches the word?</h3>
              <p>Play the word as many times as you need.</p>
            </div>
          </div>
          <div className="everyday-challenge-choices" role="group" aria-label="Choose the matching picture">
            {challengeChoices.map((item, index) => {
              const isCorrect = item.id === activeChallengeItem.id;
              const isSelected = challengeAnswer?.id === item.id;
              const resultClass = challengeAnswer
                ? isCorrect ? "is-correct" : isSelected ? "is-incorrect" : ""
                : "";
              return (
                <button className={`everyday-challenge-choice ${resultClass}`.trim()} type="button" key={item.id} disabled={Boolean(challengeAnswer)} onClick={() => answerChallenge(item)} aria-label={`Choose picture ${index + 1}`}>
                  <CardImage item={item} />
                  {challengeAnswer ? <span>{item.pinyin}</span> : null}
                  {challengeAnswer && isCorrect ? <Check className="challenge-result-icon" size={20} /> : challengeAnswer && isSelected ? <X className="challenge-result-icon" size={20} /> : null}
                </button>
              );
            })}
          </div>
          {challengeAnswer ? (
            <div className={`everyday-challenge-feedback ${challengeAnswer.correct ? "is-correct" : "is-incorrect"}`}>
              {challengeAnswer.correct ? "Correct. Nice listening." : "Try listening for the word again."}
              <span>{activeChallengeItem.pinyin} · {activeChallengeItem.hanzi} · {activeChallengeItem.english}</span>
            </div>
          ) : null}
          <div className="everyday-challenge-actions">
            <button type="button" onClick={nextChallenge} disabled={visibleVocabulary.length < 2}>Next word <ChevronRight size={18} /></button>
          </div>
        </article>
      ) : view === "flashcards" ? (
        <>
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
        </>
      ) : (
        <p className="empty-state">No vocabulary matches these filters.</p>
      )}
    </section>
  );
}
