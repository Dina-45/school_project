import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function CourseReviews() {
  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetch("http://localhost:3001/reviews")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить отзывы");
        return res.json();
      })
      .then((data) => setReviews(data))
      .catch((error) => toast.error("Ошибка загрузки отзывов"));
    fetch("http://localhost:3001/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить курсы");
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((error) => toast.error("Ошибка загрузки курсов"));
    fetch("http://localhost:3001/users")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить пользователей");
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((error) => toast.error("Ошибка загрузки пользователей"));
  }, []);

  if (user?.role !== "teacher") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  const myCourses = courses.filter((course) => course.teacherId === user.id);
  const myReviews = reviews.filter((review) =>
    review.courseId && myCourses.some((course) => course.id === review.courseId)
  );
  const nullCourseReviews = reviews.filter((review) => !review.courseId);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Отзывы и вопросы по моим курсам</h1>
      {nullCourseReviews.length > 0 && (
        <div className="alert alert-warning mb-4">
          <h5>Внимание!</h5>
          <p>
            Найдено {nullCourseReviews.length} отзыв(ов) без привязки к курсу (courseId: null).
            Пожалуйста, обновите их в базе данных.
          </p>
        </div>
      )}
      {myReviews.length === 0 ? (
        <p className="text-muted">Пока нет отзывов или вопросов.</p>
      ) : (
        <ul className="list-group">
          {myReviews.map((review) => {
            const course = courses.find((c) => c.id === review.courseId);
            const student = users.find((u) => u.id === review.studentId);
            return (
              <li key={review.id} className="list-group-item">
                <strong>Курс:</strong> {course?.name || "Неизвестный курс"} <br />
                <strong>Студент:</strong> {student?.name || "Неизвестный студент"} <br />
                <strong>Дата:</strong> {new Date(review.createdAt).toLocaleString()} <br />
                <strong>Сообщение:</strong> {review.message}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default CourseReviews;