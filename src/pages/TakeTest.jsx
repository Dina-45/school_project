import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../api";

function TakeTest() {
  const { testId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function fetchTest() {
      try {
        const res = await fetch(`${API_URL}/tests/${testId}`);
        if (!res.ok) throw new Error("Тест не найден");
        const data = await res.json();

        const enrollRes = await fetch(
          `${API_URL}/enrollments?studentId=${user.id}&courseId=${data.courseId}`
        );
        const enrollments = await enrollRes.json();
        if (enrollments.length === 0) {
          toast.error("У вас нет доступа к этому тесту!");
          navigate("/enrollments");
          return;
        }

        setTest(data);
      } catch {
        toast.error("Ошибка загрузки теста");
        navigate("/enrollments");
      }
    }
    fetchTest();
  }, [testId, user.id, navigate]);

  function handleAnswerChange(questionIndex, optionIndex) {
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!test) return;

    const allAnswered = test.questions.every((_, i) => answers[i] !== undefined);
    if (!allAnswered) {
      toast.error("Ответьте на все вопросы!");
      return;
    }

    let score = 0;
    test.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswerIndex) {
        score += 100 / test.questions.length;
      }
    });

    try {
      const res = await fetch(`${API_URL}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          courseId: test.courseId,
          testId: test.id,
          score: score.toFixed(2),
          createdAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success(`Тест сдан! Ваша оценка: ${score.toFixed(2)}`);
        navigate("/enrollments");
      } else {
        toast.error("Не удалось сохранить результат");
      }
    } catch {
      toast.error("Сетевая ошибка при сохранении результата");
    }
  }

  if (!test) return <div className="container mt-5"><h2>Загрузка...</h2></div>;

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Тест: {test.title}</h1>
      <div className="card shadow">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {test.questions.map((question, qIndex) => (
              <div key={qIndex} className="mb-4">
                <h5>{qIndex + 1}. {question.text}</h5>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name={`question-${qIndex}`}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => handleAnswerChange(qIndex, oIndex)}
                    />
                    <label className="form-check-label">{option}</label>
                  </div>
                ))}
              </div>
            ))}
            <button type="submit" className="btn btn-primary w-100">Отправить</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TakeTest;