import SpeakButton from "./SpeakButton.jsx";

export default function VocabularyCard({ item }) {
  return (
    <article className="review-card vocabulary-card">
      <div className="card-copy">
        <h3 className="hanzi">{item.hanzi}</h3>
        <p className="pinyin">{item.pinyin}</p>
        <p className="english">{item.english}</p>
      </div>
      <SpeakButton text={item.hanzi} label={`Play pronunciation for ${item.hanzi}`} />
    </article>
  );
}
