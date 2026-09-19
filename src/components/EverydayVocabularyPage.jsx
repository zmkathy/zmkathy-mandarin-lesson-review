import EverydayVocabulary from "./EverydayVocabulary.jsx";

export default function EverydayVocabularyPage({ student }) {
  return (
    <main className="content-page everyday-page">
      <header className="page-intro">
        <div>
          <p className="section-label">Extra practice</p>
          <h1>Everyday Vocabulary</h1>
          <p>Picture flashcards for useful words beyond a single lesson.</p>
        </div>
      </header>
      <EverydayVocabulary student={student} showHeading={false} />
    </main>
  );
}
