import SpeakButton from "./SpeakButton.jsx";

export default function VocabularyCard({ item, index }) {
  return (
    <article className="review-card vocabulary-card">
      <span className="item-number">{String(index).padStart(2, "0")}</span>
      <div className="card-copy">
        <h3 className="hanzi">{item.hanzi}</h3>
        <p className="pinyin">{item.pinyin}</p>
        <p className="english">{item.english}</p>
      </div>
      <SpeakButton text={item.hanzi} />
    </article>
  );
}
