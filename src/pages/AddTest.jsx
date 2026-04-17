import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function AddTest() {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [duration, setDuration] = useState(30);
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState([{ id: 1, text: "", options: ["", "", ""], correctAnswerIndex: null }]);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoadingCourses(true);
    fetch(`http://localhost:3001/courses?teacherId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setIsLoadingCourses(false);
      })
      .catch(() => {
        toast.error("Ошибка загрузки курсов");
        setIsLoadingCourses(false);
      });
  }, [user.id]);

  function handleQuestionChange(index, field, value) {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  }

  function handleOptionChange(questionIndex, optionIndex, value) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  }

  function handleCorrectAnswerChange(questionIndex, optionIndex) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].correctAnswerIndex = optionIndex;
    setQuestions(newQuestions);
  }

  function addQuestion() {
    setQuestions([...questions, { id: questions.length + 1, text: "", options: ["", "", ""], correctAnswerIndex: null }]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !courseId || !deadline || questions.some((q) => !q.text || q.options.some((o) => !o) || q.correctAnswerIndex === null)) {
      toast.error("Заполните все поля, включая правильные ответы!");
      return;
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      toast.error("Выбранный курс не найден!");
      return;
    }

    if (new Date(deadline) > new Date(course.deadline)) {
      toast.error("Дедлайн теста не может быть позже дедлайна курса!");
      return;
    }

    const newTest = {
      title,
      courseId,
      duration: parseInt(duration),
      deadline,
      questions: questions.map(q => ({
        text: q.text,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex
      })),
    };

    try {
      const response = await fetch("http://localhost:3001/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTest),
      });

      if (response.ok) {
        const test = await response.json();
        await fetch("http://localhost:3001/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            message: `Тест "${title}" добавлен для курса "${course.name}"!`,
            createdAt: new Date().toISOString(),
          }),
        });
        const enrollments = await fetch(`http://localhost:3001/enrollments?courseId=${courseId}`).then((res) => res.json());
        for (const enrollment of enrollments) {
          await fetch("http://localhost:3001/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: enrollment.studentId,
              message: `Новый тест "${title}" добавлен для курса "${course.name}". Дедлайн: ${deadline}`,
              createdAt: new Date().toISOString(),
            }),
          });
        }
        toast.success("Тест успешно добавлен!");
        navigate("/courses");
      } else {
        toast.error("Не удалось добавить тест");
      }
    } catch (error) {
      toast.error("Сетевая ошибка при добавлении теста");
    }
  }

  if (user?.role !== "teacher") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  if (isLoadingCourses) {
    return <div className="container mt-5"><h2>Загрузка курсов...</h2></div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Добавить тест</h2>
              <div>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Название теста</label>
                  <input
                    type="text"
                    id="title"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="course" className="form-label">Курс</label>
                  <select
                    id="course"
                    className="form-select"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                  >
                    <option value="">-- Выберите курс --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="duration" className="form-label">Длительность (минуты)</label>
                  <input
                    type="number"
                    id="duration"
                    className="form-control"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="deadline" className="form-label">Дедлайн теста</label>
                  <input
                    type="date"
                    id="deadline"
                    className="form-control"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
                <h4>Вопросы</h4>
                {questions.map((question, index) => (
                  <div key={question.id} className="mb-4 p-3 border rounded">
                    <div className="mb-3">
                      <label htmlFor={`question-${index}`} className="form-label">Вопрос {index + 1}</label>
                      <input
                        type="text"
                        id={`question-${index}`}
                        className="form-control"
                        value={question.text}
                        onChange={(e) => handleQuestionChange(index, "text", e.target.value)}
                        required
                      />
                    </div>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="mb-2">
                        <label htmlFor={`option-${index}-${optIndex}`} className="form-label">Вариант {optIndex + 1}</label>
                        <input
                          type="text"
                          id={`option-${index}-${optIndex}`}
                          className="form-control"
                          value={option}
                          onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                    <div className="mb-3">
                      <label className="form-label">Правильный ответ</label>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`correct-${index}`}
                            id={`correct-${index}-${optIndex}`}
                            checked={question.correctAnswerIndex === optIndex}
                            onChange={() => handleCorrectAnswerChange(index, optIndex)}
                          />
                          <label className="form-check-label" htmlFor={`correct-${index}-${optIndex}`}>
                            Вариант {optIndex + 1}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary mb-3" onClick={addQuestion}>
                  Добавить вопрос
                </button>
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleSubmit}
                  disabled={isLoadingCourses || courses.length === 0}
                >
                  Создать тест
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddTest;