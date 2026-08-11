function slugifyLessonId(title, index) {
  return `lesson-${index + 1}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function parseReviewLine(line) {
  const [hanzi, pinyin, ...englishParts] = line.split("|").map((part) => part.trim());

  if (!hanzi || !pinyin || englishParts.length === 0) {
    return null;
  }

  return {
    hanzi,
    pinyin,
    english: englishParts.join(" | ")
  };
}

export function parseLessonsText(text) {
  const lessons = [];
  let currentLesson = null;
  let currentSection = null;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("//")) {
      return;
    }

    if (line.startsWith("# ")) {
      const title = line.replace(/^#\s*/, "").replace(/^Lesson\s+\d+:\s*/i, "").trim();

      currentLesson = {
        id: slugifyLessonId(title, lessons.length),
        title,
        vocabulary: [],
        sentences: []
      };

      lessons.push(currentLesson);
      currentSection = null;
      return;
    }

    if (line.toLowerCase() === "## key vocabulary") {
      currentSection = "vocabulary";
      return;
    }

    if (line.toLowerCase() === "## key sentences") {
      currentSection = "sentences";
      return;
    }

    if (!currentLesson || !currentSection) {
      return;
    }

    const item = parseReviewLine(line);

    if (item) {
      currentLesson[currentSection].push(item);
    }
  });

  return lessons.filter(
    (lesson) => lesson.vocabulary.length > 0 || lesson.sentences.length > 0
  );
}
