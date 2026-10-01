import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Headphones, MessageCircleMore, Mic2, Volume2 } from "lucide-react";
import SentenceCard from "./SentenceCard.jsx";
import SpeakButton from "./SpeakButton.jsx";

const lessonPlans = {
  1: {
    goals: ["Say hello", "Ask a name", "Introduce yourself politely"],
    groups: [
      { title: "Say hello", sentenceIndexes: [0, 1, 2, 3, 4, 5] },
      { title: "Exchange names", sentenceIndexes: [6, 7, 8, 9, 10] },
      { title: "Meet politely", sentenceIndexes: [11, 12, 18, 19] },
      { title: "Introduce people", sentenceIndexes: [13, 14, 15, 16, 17] }
    ],
    dialogue: [
      { speaker: "A", hanzi: "您好！您贵姓？", pinyin: "nín hǎo! nín guì xìng?" },
      { speaker: "B", hanzi: "我姓王。我叫王安娜。", pinyin: "wǒ xìng Wáng. wǒ jiào Wáng Ānnà." },
      { speaker: "A", hanzi: "很高兴认识你。", pinyin: "hěn gāoxìng rènshi nǐ." },
      { speaker: "B", hanzi: "我也很高兴认识你。", pinyin: "wǒ yě hěn gāoxìng rènshi nǐ." }
    ],
    prompts: [
      { cue: "Ask politely for a surname.", hanzi: "您贵姓？", pinyin: "nín guì xìng?" },
      { cue: "Say your name.", hanzi: "我叫……", pinyin: "wǒ jiào..." },
      { cue: "Say: Nice to meet you.", hanzi: "很高兴认识你。", pinyin: "hěn gāoxìng rènshi nǐ." }
    ],
    listening: [
      { prompt: "您贵姓？", pinyin: "nín guì xìng?", answer: "我姓王。", choices: [{ hanzi: "我姓王。", pinyin: "wǒ xìng Wáng." }, { hanzi: "我二十岁。", pinyin: "wǒ èrshí suì." }, { hanzi: "不客气。", pinyin: "bú kèqi." }] },
      { prompt: "你叫什么名字？", pinyin: "nǐ jiào shénme míngzi?", answer: "我叫安娜。", choices: [{ hanzi: "我叫安娜。", pinyin: "wǒ jiào Ānnà." }, { hanzi: "我姓老师。", pinyin: "wǒ xìng lǎoshī." }, { hanzi: "我很好。", pinyin: "wǒ hěn hǎo." }] },
      { prompt: "很高兴认识你。", pinyin: "hěn gāoxìng rènshi nǐ.", answer: "我也很高兴认识你。", choices: [{ hanzi: "我也很高兴认识你。", pinyin: "wǒ yě hěn gāoxìng rènshi nǐ." }, { hanzi: "她很漂亮。", pinyin: "tā hěn piàoliang." }, { hanzi: "我是学生。", pinyin: "wǒ shì xuésheng." }] }
    ],
    challenge: [{ hanzi: "您好。", pinyin: "nín hǎo.", english: "Say hello." }, { hanzi: "我叫……", pinyin: "wǒ jiào...", english: "Say your name." }, { hanzi: "我姓……", pinyin: "wǒ xìng...", english: "Say your surname." }]
  },
  2: {
    goals: ["Ask about age", "Talk about birth years", "Share a zodiac sign"],
    groups: [
      { title: "Recognize people", sentenceIndexes: [0, 1, 2, 3, 4] },
      { title: "Ask about age", sentenceIndexes: [5, 6, 7, 8, 9] },
      { title: "Estimate and share a birth year", sentenceIndexes: [10, 11, 12, 13] },
      { title: "Talk about zodiac signs", sentenceIndexes: [14, 15, 16, 17, 18] }
    ],
    dialogue: [
      { speaker: "A", hanzi: "你多大？", pinyin: "nǐ duō dà?" },
      { speaker: "B", hanzi: "我二十岁。你呢？", pinyin: "wǒ èrshí suì. nǐ ne?" },
      { speaker: "A", hanzi: "我二十二岁。我属龙。", pinyin: "wǒ èrshí'èr suì. wǒ shǔ lóng." },
      { speaker: "B", hanzi: "我属兔。", pinyin: "wǒ shǔ tù." }
    ],
    prompts: [
      { cue: "Ask a person's age.", hanzi: "你多大？", pinyin: "nǐ duō dà?" },
      { cue: "Say: I am about forty years old.", hanzi: "我四十岁左右。", pinyin: "wǒ sìshí suì zuǒyòu." },
      { cue: "Ask about a zodiac sign.", hanzi: "你属什么？", pinyin: "nǐ shǔ shénme?" }
    ],
    listening: [
      { prompt: "你多大？", pinyin: "nǐ duō dà?", answer: "我二十岁。", choices: [{ hanzi: "我二十岁。", pinyin: "wǒ èrshí suì." }, { hanzi: "我姓王。", pinyin: "wǒ xìng Wáng." }, { hanzi: "她很漂亮。", pinyin: "tā hěn piàoliang." }] },
      { prompt: "你属什么？", pinyin: "nǐ shǔ shénme?", answer: "我属龙。", choices: [{ hanzi: "我属龙。", pinyin: "wǒ shǔ lóng." }, { hanzi: "我二十岁。", pinyin: "wǒ èrshí suì." }, { hanzi: "不客气。", pinyin: "bú kèqi." }] },
      { prompt: "你是哪年出生的？", pinyin: "nǐ shì nǎ nián chūshēng de?", answer: "我是一九九八年出生的。", choices: [{ hanzi: "我是一九九八年出生的。", pinyin: "wǒ shì yī jiǔ jiǔ bā nián chūshēng de." }, { hanzi: "我是老师。", pinyin: "wǒ shì lǎoshī." }, { hanzi: "我姓王。", pinyin: "wǒ xìng Wáng." }] }
    ],
    challenge: [{ hanzi: "你多大？", pinyin: "nǐ duō dà?", english: "Ask a person's age." }, { hanzi: "我……岁。", pinyin: "wǒ...suì.", english: "Say your age." }, { hanzi: "我属……", pinyin: "wǒ shǔ...", english: "Say your zodiac sign." }]
  }
};

function playDialogue(lines) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  lines.forEach((line) => {
    const utterance = new SpeechSynthesisUtterance(line.hanzi);
    utterance.lang = "zh-CN";
    utterance.rate = 0.84;
    window.speechSynthesis.speak(utterance);
  });
}

export default function ConversationLessonPage({ lesson, course, lessonNumber, totalLessons, onBack, onPrevious, onNext, previousTitle, nextTitle }) {
  const plan = lessonPlans[lessonNumber];
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [listeningIndex, setListeningIndex] = useState(0);
  const [revealedPrompts, setRevealedPrompts] = useState(new Set());
  const [hasPracticed, setHasPracticed] = useState(false);

  if (!plan) return null;
  const listeningQuestion = plan.listening[listeningIndex];

  return (
    <main className="content-page lesson-page conversation-lesson-page">
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={19} />{course.title}</button>

      <header className="lesson-header conversation-lesson-header">
        <span className="lesson-badge">{String(lessonNumber).padStart(2, "0")}</span>
        <div><p className="section-label">Lesson {lessonNumber} of {totalLessons}</p><h1>{lesson.title}</h1><p className="lesson-summary">Use familiar Mandarin to take part in a short, natural conversation.</p></div>
      </header>

      <section className="speaking-goal" aria-labelledby="speaking-goal-title">
        <div><p className="section-label">Today's speaking goal</p><h2 id="speaking-goal-title">By the end, you can:</h2></div>
        <ul>{plan.goals.map((goal) => <li key={goal}><CheckCircle2 size={17} />{goal}</li>)}</ul>
      </section>

      <section className="lesson-section" aria-labelledby="vocabulary-title">
        <div className="lesson-section-heading"><h2 id="vocabulary-title">Useful words & chunks</h2><span>{lesson.vocabulary.length}</span></div>
        <p className="conversation-section-note">Listen first, then use each word in the conversation below.</p>
        <div className="card-list">{lesson.vocabulary.map((item, index) => <VocabularyCardPreview key={`${lesson.id}-${item.hanzi}`} item={item} index={index + 1} />)}</div>
      </section>

      <section className="lesson-section" aria-labelledby="sentences-title">
        <div className="lesson-section-heading"><h2 id="sentences-title">Key sentences</h2><span>{lesson.sentences.length}</span></div>
        <div className="conversation-sentence-groups">
          {plan.groups.map((group) => <section className="conversation-sentence-group" key={group.title}><h3>{group.title}</h3><div className="card-list">{group.sentenceIndexes.map((sentenceIndex) => {
            const item = lesson.sentences[sentenceIndex];
            return item ? <SentenceCard key={`${lesson.id}-${sentenceIndex}`} item={item} index={sentenceIndex + 1} /> : null;
          })}</div></section>)}
        </div>
      </section>

      <section className="conversation-practice" aria-labelledby="conversation-practice-title">
        <div className="conversation-panel-heading"><span><MessageCircleMore size={22} /></span><div><p className="section-label">Conversation practice</p><h2 id="conversation-practice-title">Put the phrases together</h2><p>Listen to the exchange, then read each turn aloud.</p></div></div>
        <div className="dialogue-lines">{plan.dialogue.map((line, index) => <article className={`dialogue-line speaker-${line.speaker.toLowerCase()}`} key={`${line.speaker}-${index}`}><span>{line.speaker}</span><div><strong>{line.hanzi}</strong><small>{line.pinyin}</small></div><SpeakButton text={line.hanzi} /></article>)}</div>
        <div className="conversation-actions"><button type="button" onClick={() => playDialogue(plan.dialogue)}><Volume2 size={18} />Play dialogue</button><button className="secondary" type="button" onClick={() => setHasPracticed(true)}><Mic2 size={18} />{hasPracticed ? "Practiced" : "Practice aloud"}</button></div>
        <div className="conversation-cues"><p>Try these without looking first:</p>{plan.prompts.map((prompt, index) => <button className={revealedPrompts.has(index) ? "is-revealed" : ""} type="button" key={prompt.cue} onClick={() => setRevealedPrompts((current) => new Set([...current, index]))}><span>{prompt.cue}</span>{revealedPrompts.has(index) ? <strong>{prompt.hanzi}<small>{prompt.pinyin}</small></strong> : <em>Reveal Mandarin</em>}</button>)}</div>
      </section>

      <section className="listening-response" aria-labelledby="listening-response-title">
        <div className="conversation-panel-heading"><span><Headphones size={22} /></span><div><p className="section-label">Listen & respond · {listeningIndex + 1} of {plan.listening.length}</p><h2 id="listening-response-title">Choose the natural reply</h2><p>Listen first. Then choose what you would say next.</p></div></div>
        <div className="listening-prompt"><div><strong>{listeningQuestion.prompt}</strong><b>{listeningQuestion.pinyin}</b><small>Tap the sound button before choosing.</small></div><SpeakButton text={listeningQuestion.prompt} /></div>
        <div className="listening-options">{listeningQuestion.choices.map((choice) => <button className={selectedAnswer === choice.hanzi ? (choice.hanzi === listeningQuestion.answer ? "is-correct" : "is-incorrect") : ""} type="button" key={choice.hanzi} onClick={() => setSelectedAnswer(choice.hanzi)}><strong>{choice.hanzi}</strong><small>{choice.pinyin}</small></button>)}</div>
        {selectedAnswer ? <div className="listening-feedback-wrap"><p className={`listening-feedback${selectedAnswer === listeningQuestion.answer ? " is-correct" : ""}`}>{selectedAnswer === listeningQuestion.answer ? "Exactly. That reply fits the conversation." : "Try again. Think about what the question is asking."}</p>{listeningIndex < plan.listening.length - 1 ? <button type="button" onClick={() => { setListeningIndex((current) => current + 1); setSelectedAnswer(""); }}>Next question <ArrowRight size={16} /></button> : null}</div> : null}
      </section>

      <section className="speaking-challenge" aria-labelledby="speaking-challenge-title"><span><Mic2 size={24} /></span><div><p className="section-label">Speaking challenge</p><h2 id="speaking-challenge-title">Make it your own</h2><p>Say each line aloud, then change the information to make it yours.</p><ol>{plan.challenge.map((step) => <li key={step.hanzi}><strong>{step.hanzi}</strong><small>{step.pinyin}</small><em>{step.english}</em></li>)}</ol></div></section>

      <nav className="lesson-pagination" aria-label="Lesson navigation">
        {onPrevious ? <button type="button" onClick={onPrevious}><ArrowLeft size={19} /><span><small>Previous lesson</small><strong>{previousTitle}</strong></span></button> : <span />}
        {onNext ? <button className="next-lesson" type="button" onClick={onNext}><span><small>Next lesson</small><strong>{nextTitle}</strong></span><ArrowRight size={19} /></button> : <span />}
      </nav>
    </main>
  );
}

function VocabularyCardPreview({ item, index }) {
  return <article className="review-card vocabulary-card"><span className="item-number">{String(index).padStart(2, "0")}</span><div className="card-copy"><h3 className="hanzi">{item.hanzi}</h3><p className="pinyin">{item.pinyin}</p><p className="english">{item.english}</p></div><SpeakButton text={item.hanzi} /></article>;
}
