import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import { filterCoursesByClass } from "../courseReducer";
import { API_URL, UPLOAD_URL } from "../api";

function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [files, setFiles] = useState([]);
  const [tests, setTests] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState(null);
  const [reviewInputs, setReviewInputs] = useState({});
  const [testState, setTestState] = useState({});
  const user = useSelector((state) => state.auth.user);
  const { filteredCourses } = useSelector((state) => state.courses);
  const dispatch = useDispatch();

  useEffect(() => {
    fetch(`${API_URL}/enrollments?studentId=${user.id}`)
      .then((res) => res.json())
      .then(setEnrollments)
      .catch(() => toast.error("Ошибка загрузки записей"));

    fetch(`${API_URL}/files`)
      .then((res) => res.json())
      .then(setFiles)
      .catch(() => toast.error("Ошибка загрузки файлов"));

    fetch(`${API_URL}/tests`)
      .then((res) => res.json())
      .then(setTests)
      .catch(() => toast.error("Ошибка загрузки тестов"));

    fetch(`${API_URL}/grades?studentId=${user.id}`)
      .then((res) => res.json())
      .then(setGrades)
      .catch(() => toast.error("Ошибка загрузки оценок"));

    if (user.role === "student") {
      dispatch(filterCoursesByClass(user.classId));
    }
  }, [user.id, user.classId, dispatch]);

  async function handleEnroll(e) {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error("Выберите курс.");
      return;
    }
    const course = filteredCourses.find((c) => String(c.id) === String(selectedCourse));
    if (!course) {
      toast.error("Выбранный курс не найден!");
      return;
    }

    const alreadyEnrolled = enrollments.some(
      (e) => String(e.courseId) === String(selectedCourse)
    );
    if (alreadyEnrolled) {
      toast.error("Вы уже записаны на этот курс!");
      return;
    }

    if (new Date() > new Date(course.deadline)) {
      toast.error("Дедлайн курса истек!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, courseId: selectedCourse }),
      });

      if (res.ok) {
        const enrollment = await res.json();
        setEnrollments([...enrollments, enrollment]);
        await fetch(`${API_URL}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            message: `Записан на ${course.name}!`,
            createdAt: new Date().toISOString(),
          }),
        });
        toast.success("Успешно записан!");
      } else {
        toast.error("Не удалось записаться");
      }
    } catch {
      toast.error("Сетевая ошибка при записи");
    }
  }

  async function handleUnenroll() {
    try {
      const res = await fetch(`${API_URL}/enrollments/${enrollmentToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEnrollments(enrollments.filter((e) => e.id !== enrollmentToDelete));
        toast.success("Успешно отписан!");
      } else {
        toast.error("Не удалось отписаться");
      }
    } catch {
      toast.error("Сетевая ошибка при отписке");
    }
    setIsModalOpen(false);
  }

  async function handleReviewSubmit(courseId, courseName, teacherId) {
    const message = reviewInputs[courseId];
    if (!message?.trim()) {
      toast.error("Отзыв не может быть пустым!");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          studentId: user.id,
          message: message.trim(),
          createdAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setReviewInputs((prev) => ({ ...prev, [courseId]: "" }));
        toast.success("Отзыв отправлен!");
        await fetch(`${API_URL}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: teacherId,
            message: `Новый отзыв на курс "${courseName}" от ${user.name}: ${message}`,
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        toast.error("Не удалось отправить отзыв");
      }
    } catch {
      toast.error("Сетевая ошибка при отправке отзыва");
    }
  }

  async function handleTestSubmit(testId, courseId, answers) {
    const test = tests.find((t) => t.id === testId);
    if (!test) return;

    let score = 0;
    test.questions.forEach((q, index) => {
      if (q.options.indexOf(answers[index]) === q.correctAnswerIndex) {
        score += 100 / test.questions.length;
      }
    });

    try {
      const res = await fetch(`${API_URL}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          courseId,
          testId,
          score: score.toFixed(2),
          createdAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        const savedGrade = await res.json();
        setGrades([...grades, savedGrade]);
        setTestState((prev) => ({ ...prev, [testId]: { ...prev[testId], completed: true } }));
        toast.success(`Тест сдан! Оценка: ${score.toFixed(2)}`);
      } else {
        toast.error("Не удалось сохранить результат");
      }
    } catch {
      toast.error("Сетевая ошибка при сохранении результата");
    }
  }

  function startTest(testId) {
    const test = tests.find((t) => t.id === testId);
    if (!test) { toast.error("Тест не найден!"); return; }
    if (new Date() > new Date(test.deadline)) { toast.error("Дедлайн теста истек!"); return; }

    setTestState((prev) => ({
      ...prev,
      [testId]: { timeLeft: test.duration * 60, answers: [], started: true },
    }));

    const timer = setInterval(() => {
      setTestState((prev) => {
        const timeLeft = prev[testId].timeLeft - 1;
        if (timeLeft <= 0) {
          clearInterval(timer);
          handleTestSubmit(testId, test.courseId, prev[testId].answers);
          return { ...prev, [testId]: { ...prev[testId], completed: true } };
        }
        return { ...prev, [testId]: { ...prev[testId], timeLeft } };
      });
    }, 1000);
  }

  const isImage = (fileName) => /\.(jpg|jpeg|png)$/i.test(fileName);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Мои записи</h1>

      {/* Enrollment form */}
      {user.role === "student" && (
        <div className="card mb-5">
          <div className="card-body">
            <form onSubmit={handleEnroll}>
              <div className="mb-3">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="form-select"
                  disabled={filteredCourses.length === 0}
                >
                  <option value="">-- Выберите курс --</option>
                  {filteredCourses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
                {filteredCourses.length === 0 && (
                  <p className="text-muted mt-2">Нет доступных курсов.</p>
                )}
              </div>
              <button type="submit" className="btn btn-primary w-100"
                disabled={filteredCourses.length === 0}>
                Записаться
              </button>
            </form>
          </div>
        </div>
      )}

      <h3>Записи</h3>
      {enrollments.length === 0 ? (
        <p className="text-muted">Нет записей на курсы.</p>
      ) : (
        <ul className="list-group">
          {enrollments
            .map((enrollment) => {
              // FIX: String comparison for IDs
              const course = filteredCourses.find((c) => String(c.id) === String(enrollment.courseId));
              return course
                ? { ...enrollment, courseName: course.name, teacherId: course.teacherId, courseDeadline: course.deadline }
                : null;
            })
            .filter(Boolean)
            .map((enrollment) => {
              const test = tests.find((t) => String(t.courseId) === String(enrollment.courseId));
              const courseGrades = grades.filter((g) => String(g.courseId) === String(enrollment.courseId));

              return (
                <li key={enrollment.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Курс: {enrollment.courseName} (Дедлайн: {enrollment.courseDeadline})</span>
                    <button onClick={() => { setEnrollmentToDelete(enrollment.id); setIsModalOpen(true); }}
                      className="btn btn-danger btn-sm">
                      Отписаться
                    </button>
                  </div>

                  {/* Files */}
                  <ul className="mt-2">
                    {files
                      .filter((f) => String(f.courseId) === String(enrollment.courseId))
                      .map((f) => (
                        <li key={f.id} className="d-flex align-items-center gap-2 mt-1">
                          {isImage(f.fileName) ? (
                            <img src={`${UPLOAD_URL}${f.filePath}`} alt={f.fileName}
                              className="img-thumbnail" style={{ width: "100px", height: "100px" }} />
                          ) : (
                            <a href={`${UPLOAD_URL}${f.filePath}`} download className="text-primary">
                              {f.fileName}
                            </a>
                          )}
                        </li>
                      ))}
                  </ul>

                  {/* Review */}
                  <div className="mt-3">
                    <label htmlFor={`review-${enrollment.courseId}`} className="form-label">
                      Оставить отзыв:
                    </label>
                    <textarea id={`review-${enrollment.courseId}`} className="form-control mb-2" rows="2"
                      value={reviewInputs[enrollment.courseId] || ""}
                      onChange={(e) => setReviewInputs((prev) => ({ ...prev, [enrollment.courseId]: e.target.value }))}
                      placeholder="Напишите отзыв или вопрос..." />
                    <button onClick={() => handleReviewSubmit(enrollment.courseId, enrollment.courseName, enrollment.teacherId)}
                      className="btn btn-primary btn-sm">
                      Отправить
                    </button>
                  </div>

                  {/* Test */}
                  {test ? (
                    testState[test.id]?.completed ? (
                      <p className="mt-3 text-success">Тест завершён!</p>
                    ) : (
                      <div className="mt-3">
                        <h5>Тест: {test.title} (Дедлайн: {test.deadline})</h5>
                        {new Date() > new Date(test.deadline) ? (
                          <p className="text-danger">Дедлайн теста истек!</p>
                        ) : !testState[test.id]?.started ? (
                          <button onClick={() => startTest(test.id)} className="btn btn-success">
                            Начать тест
                          </button>
                        ) : (
                          <div>
                            <p>Осталось: {Math.floor(testState[test.id].timeLeft / 60)}:
                              {String(testState[test.id].timeLeft % 60).padStart(2, "0")}</p>
                            {test.questions.map((q, index) => (
                              <div key={index} className="mb-3">
                                <p>{q.text}</p>
                                {q.options.map((option, optIndex) => (
                                  <div key={optIndex} className="form-check">
                                    <input type="radio" name={`q-${test.id}-${index}`}
                                      className="form-check-input"
                                      checked={testState[test.id]?.answers[index] === option}
                                      onChange={() => {
                                        const newAnswers = [...(testState[test.id]?.answers || [])];
                                        newAnswers[index] = option;
                                        setTestState((prev) => ({
                                          ...prev,
                                          [test.id]: { ...prev[test.id], answers: newAnswers },
                                        }));
                                      }} />
                                    <label className="form-check-label">{option}</label>
                                  </div>
                                ))}
                              </div>
                            ))}
                            <button onClick={() => handleTestSubmit(test.id, test.courseId, testState[test.id].answers)}
                              className="btn btn-primary">
                              Отправить тест
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="mt-3 text-muted">Тестов для этого курса нет.</p>
                  )}

                  {/* Grades */}
                  {courseGrades.length > 0 && (
                    <div className="mt-3">
                      <h5>Мои оценки</h5>
                      <ul className="list-group">
                        {courseGrades.map((g) => (
                          <li key={g.id} className="list-group-item">
                            Тест: {g.testId} | Оценка: {g.score} | {new Date(g.createdAt).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onConfirm={handleUnenroll} message="Отписаться от этого курса?" />
    </div>
  );
}

export default Enrollments;