export function getAvailableLessonNumbers(student, stage, lessonCount) {
  if (!student) return Array.from({ length: lessonCount }, (_, index) => index + 1);

  const access = student.courseAccess?.find((item) => Number(item.stage) === stage);
  if (Array.isArray(access?.lessons)) {
    return [...new Set(access.lessons.map(Number))]
      .filter((number) => number >= 1 && number <= lessonCount)
      .sort((a, b) => a - b);
  }

  const fallbackMax = stage === 1 ? Number(student.maxLesson ?? 0) : 0;
  const maxLesson = Math.min(Math.max(Number(access?.maxLesson ?? fallbackMax), 0), lessonCount);
  return Array.from({ length: maxLesson }, (_, index) => index + 1);
}
