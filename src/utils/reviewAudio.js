const recordedLessonNumbers = new Set([1, 2, 3, 5, 6, 9]);

export function getReviewAudioSrc(lessonNumber, section, itemNumber) {
  if (!recordedLessonNumbers.has(lessonNumber)) return undefined;

  const filename = `${section}-${String(itemNumber).padStart(2, "0")}.mp3`;
  return `${import.meta.env.BASE_URL}audio/lesson-review/lesson-${lessonNumber}/${filename}`;
}
