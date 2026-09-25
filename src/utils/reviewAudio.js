const recordedLessonNumbers = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

export function getReviewAudioSrc(lessonNumber, section, itemNumber) {
  if (!recordedLessonNumbers.has(lessonNumber)) return undefined;

  const extension = [5, 9, 11].includes(lessonNumber) ? "m4a" : "mp3";
  const filename = `${section}-${String(itemNumber).padStart(2, "0")}.${extension}`;
  const revision = lessonNumber === 9 ? "?v=20260919-3" : "";
  return `${import.meta.env.BASE_URL}audio/lesson-review/lesson-${lessonNumber}/${filename}${revision}`;
}
