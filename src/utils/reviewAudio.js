const recordedLessonNumbers = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

export function getReviewAudioSrc(lessonNumber, section, itemNumber) {
  if (!recordedLessonNumbers.has(lessonNumber)) return undefined;

  const extension = [5, 9].includes(lessonNumber) ? "m4a" : "mp3";
  const filename = `${section}-${String(itemNumber).padStart(2, "0")}.${extension}`;
  return `${import.meta.env.BASE_URL}audio/lesson-review/lesson-${lessonNumber}/${filename}`;
}
