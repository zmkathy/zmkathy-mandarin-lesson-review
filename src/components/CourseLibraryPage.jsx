import { ArrowRight, BookOpen } from "lucide-react";
import { courses } from "../data/courses.js";
import { getAvailableLessonNumbers } from "../lib/courseAccess.js";

export default function CourseLibraryPage({ lessons, student, teacherLoggedIn, onOpenCourse }) {
  const availableCourses = courses.filter((course) => {
    if (teacherLoggedIn || !student) return true;
    return getAvailableLessonNumbers(student, course.stage, lessons.length).length > 0;
  });

  return (
    <main className="content-page course-library-page">
      <header className="page-intro course-library-intro">
        <p className="section-label">Your learning library</p>
        <h1>My Courses</h1>
        <p>Choose a course to review its lessons and practice materials.</p>
      </header>

      {availableCourses.length > 0 ? (
        <section className="course-library-grid" aria-label="Available courses">
          {availableCourses.map((course) => {
            const availableLessonCount = getAvailableLessonNumbers(student, course.stage, lessons.length).length;
            const accessNote = teacherLoggedIn
              ? `${lessons.length} lessons · Full teacher access`
              : `${availableLessonCount} ${availableLessonCount === 1 ? "lesson" : "lessons"} available`;

            return (
              <button className="course-library-card" type="button" key={course.id} onClick={() => onOpenCourse(course.id)}>
                <span className="course-library-icon"><BookOpen size={26} /></span>
                <span className="course-library-copy">
                  <span className="resource-kicker">{course.level} · {course.type}</span>
                  <strong>{course.title}</strong>
                  <span>{course.description}</span>
                  <small>{accessNote}</small>
                </span>
                <ArrowRight className="course-library-arrow" size={23} />
              </button>
            );
          })}
        </section>
      ) : (
        <section className="empty-course-library">
          <BookOpen size={28} />
          <h2>No courses available yet</h2>
          <p>Your teacher will add a course here when it is ready for you.</p>
        </section>
      )}
    </main>
  );
}
