import { useRef, useState } from "react";
import { Search, Volume2, X } from "lucide-react";
import { finalSamples, initialSamples, pinyinChart } from "../data/pinyinChart.js";

const toneMarks = {
  a: ["ā", "á", "ǎ", "à"], o: ["ō", "ó", "ǒ", "ò"], e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"], u: ["ū", "ú", "ǔ", "ù"], ü: ["ǖ", "ǘ", "ǚ", "ǜ"]
};
const toneNames = ["1st tone", "2nd tone", "3rd tone", "4th tone"];

function markTone(syllable, tone) {
  let target = ["a", "o", "e"].find((vowel) => syllable.includes(vowel));
  if (!target && syllable.includes("iu")) target = "u";
  if (!target && syllable.includes("ui")) target = "i";
  if (!target) target = ["i", "u", "ü"].find((vowel) => syllable.includes(vowel));
  return target ? syllable.replace(target, toneMarks[target][tone - 1]) : syllable;
}

function audioSlug(syllable, tone) {
  return `${syllable.toLowerCase().replaceAll("ü", "v")}${tone}_FV2_MP3.mp3`;
}

export default function PinyinChart() {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState("Choose a tone to listen.");
  const [playingTone, setPlayingTone] = useState(null);
  const audioRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase().replaceAll("ü", "v");

  function selectSound(syllable, kind, rowIndex, columnIndex) {
    const spoken = kind === "initial" ? initialSamples[syllable]
      : kind === "final" ? finalSamples[syllable] || syllable
        : syllable;
    const description = kind === "initial" ? `Initial · practice as ${spoken}`
      : kind === "final" ? `Final · ${syllable}`
        : `${pinyinChart[0][columnIndex] || "No initial"} + ${pinyinChart[rowIndex][0]}`;
    audioRef.current?.pause();
    setPlayingTone(null);
    setStatus("Choose a tone to listen.");
    setSelection({ syllable, spoken, kind, rowIndex, columnIndex, description });
  }

  function playTone(tone) {
    const marked = markTone(selection.spoken, tone);
    const src = `${import.meta.env.BASE_URL}audio/pinyin/${audioSlug(selection.spoken, tone)}`;
    const audio = audioRef.current;
    audio.pause();
    audio.src = src;
    audio.load();
    setPlayingTone(tone);
    setStatus(`Loading ${marked}...`);
    audio.onended = () => setPlayingTone(null);
    audio.play().then(() => setStatus(`Playing ${marked} · ${toneNames[tone - 1]}`)).catch(() => {
      setPlayingTone(null);
      setStatus(`The recording for ${marked} is being prepared.`);
    });
  }

  function soundButton(syllable, kind, rowIndex, columnIndex) {
    const normalized = syllable.toLowerCase().replaceAll("ü", "v");
    const isMatch = normalizedQuery && normalized.includes(normalizedQuery);
    const isMuted = normalizedQuery && !isMatch;
    const isSelected = selection?.syllable === syllable && selection?.kind === kind
      && selection?.rowIndex === rowIndex && selection?.columnIndex === columnIndex;
    return (
      <button
        className={`sound-button${isMatch ? " is-match" : ""}${isMuted ? " is-muted" : ""}${isSelected ? " is-selected" : ""}`}
        type="button"
        onClick={() => selectSound(syllable, kind, rowIndex, columnIndex)}
        aria-label={`Open tones for ${syllable}`}
      >
        {syllable}
      </button>
    );
  }

  return (
    <main className="content-page pinyin-page">
      <header className="page-intro pinyin-intro">
        <div>
          <p className="section-label">Pronunciation tool</p>
          <h1>Pinyin Chart</h1>
          <p>Choose an initial, final, or complete syllable, then listen to its four tones.</p>
        </div>
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Search Pinyin</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Pinyin (use v for ü)" />
        </label>
      </header>

      <section className="chart-frame" aria-label="Pinyin combinations chart">
        <div className="chart-scroll">
          <table className="pinyin-table">
            <thead><tr>{pinyinChart[0].map((initial, columnIndex) => (
              <th key={`head-${columnIndex}`}>
                {columnIndex === 0 ? <span className="axis-label">final ↓<br />initial →</span>
                  : columnIndex === 1 ? <span aria-label="No initial">∅</span>
                    : soundButton(initial, "initial", 0, columnIndex)}
              </th>
            ))}</tr></thead>
            <tbody>{pinyinChart.slice(1).map((row, rowOffset) => {
              const rowIndex = rowOffset + 1;
              return <tr key={`row-${rowIndex}`}>{row.map((syllable, columnIndex) => {
                if (columnIndex === 0) return <th key={`final-${rowIndex}`}>{soundButton(syllable, "final", rowIndex, 0)}</th>;
                return <td key={`cell-${rowIndex}-${columnIndex}`}>{syllable ? soundButton(syllable, "syllable", rowIndex, columnIndex) : null}</td>;
              })}</tr>;
            })}</tbody>
          </table>
        </div>
      </section>
      <p className="chart-help">Tap a sound, then choose a tone. On a phone, swipe sideways to see all initials.</p>
      <p className="audio-credit">
        Pronunciation audio from <a href="https://tone.lib.msu.edu/" target="_blank" rel="noreferrer">Tone Perfect</a> by Catherine Ryu, the Mandarin Tone Perception &amp; Production Team, and Michigan State University Libraries. FV2 recordings used without audio modification under <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>.
      </p>

      {selection ? (
        <aside className="tone-panel" aria-live="polite" aria-label="Tone choices">
          <div className="tone-heading">
            <div><strong>{selection.syllable}</strong><span>{selection.description}</span></div>
            <button className="icon-button" type="button" onClick={() => setSelection(null)} aria-label="Close tone choices" title="Close"><X size={20} /></button>
          </div>
          <div className="tone-options">{[1, 2, 3, 4].map((tone) => (
            <button className={playingTone === tone ? "is-playing" : ""} type="button" key={tone} onClick={() => playTone(tone)}>
              <span>{markTone(selection.spoken, tone)}</span>
              <small><Volume2 size={15} /> {toneNames[tone - 1]}</small>
            </button>
          ))}</div>
          <audio className="tone-audio" ref={audioRef} controls preload="none">
            Your browser does not support audio playback.
          </audio>
          <p className="audio-status">{status}</p>
        </aside>
      ) : null}
    </main>
  );
}
