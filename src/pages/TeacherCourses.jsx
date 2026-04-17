import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../components/Modal";

function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [grades, setGrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetch(`http://localhost:3001/courses?teacherId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch((error) => toast.error("Ошибка загрузки курсов"));
    fetch("http://localhost:3001/tests")
      .then((res) => res.json())
      .then((data) => setTests(data))
      .catch((error) => toast.error("Ошибка загрузки тестов"));
    fetch("http://localhost:3001/grades")
      .then((res) => res.json())
      .then((data) => setGrades(data))
      .catch((error) => toast.error("Ошибка загрузки оценок"));
    fetch("http://localhost:3001/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((error) => toast.error("Ошибка загрузки пользователей"));
  }, [user.id]);

  function openDeleteModal(id) {
    setCourseToDelete(id);
    setIsModalOpen(true);
  }

  async function handleDelete() {
    try {
      const response = await fetch(`http://localhost:3001/courses/${courseToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCourses(courses.filter((course) => course.id !== courseToDelete));
        toast.success("Курс удален!");
      } else {
        toast.error("Не удалось удалить курс");
      }
    } catch (error) {
      toast.error("Сетевая ошибка при удалении курса");
    }
    setIsModalOpen(false);
  }

  if (user?.role !== "teacher") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Мои курсы</h1>
      <Link to="/add-course" className="btn btn-primary mb-4">
        Добавить курс
      </Link>
      <ul className="list-group">
        {courses.map((course) => {
          const courseTests = tests.filter((t) => t.courseId === course.id);
          const courseGrades = grades.filter((g) => g.courseId === course.id);
          return (
            <li key={course.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  {course.name} (ID: {course.id}, Дедлайн: {course.deadline})
                </span>
                <div>
                  <Link
                    to={`/edit-course/${course.id}`}
                    className="btn btn-warning btn-sm me-2"
                  >
                    Редактировать
                  </Link>
                  <button
                    onClick={() => openDeleteModal(course.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              {courseTests.length > 0 ? (
                <div className="mt-3">
                  <h5>Тесты</h5>
                  <ul className="list-group">
                    {courseTests.map((test) => (
                      <li key={test.id} className="list-group-item">
                        <strong>{test.title}</strong> (Дедлайн: {test.deadline})
                        <p>Продолжительность: {test.duration} мин</p>
                        <ul>
                          {test.questions.map((q) => (
                            <li key={q.id}>
                              {q.text} (Правильный ответ: {q.options[q.correctAnswerIndex]})
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-muted">Тесты для этого курса отсутствуют.</p>
              )}
              {courseGrades.length > 0 && (
                <div className="mt-3">
                  <h5>Оценки студентов</h5>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Студент</th>
                        <th>Тест ID</th>
                        <th>Оценка</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseGrades.map((grade) => {
                        const student = users.find(
                          (u) => u.id === grade.studentId
                        );
                        return (
                          <tr key={grade.id}>
                            <td>{student ? student.name : "Неизвестно"}</td>
                            <td>{grade.testId}</td>
                            <td>{grade.score}</td>
                            <td>
                              {new Date(grade.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {tests.some((t) => !t.courseId) && (
        <div className="mt-4 alert alert-warning">
          <h5>Внимание!</h5>
          <p>Некоторые тесты не привязаны к курсам (courseId: null). Пожалуйста, обновите их в базе данных.</p>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        message="Вы уверены, что хотите удалить этот курс?"
      />
    </div>
  );
}

export default TeacherCourses;