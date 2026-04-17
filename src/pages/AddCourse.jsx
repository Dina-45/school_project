import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addCourse } from "../courseReducer";
import { API_URL, UPLOAD_URL } from "../api";

function AddCourse() {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/classes`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setClasses(data))
      .catch(() => toast.error("Ошибка загрузки классов"))
      .finally(() => setIsLoadingClasses(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !classId || !deadline) {
      toast.error("Заполните все обязательные поля!");
      return;
    }

    let filePath = null;

    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Допустимы только JPEG, PNG или PDF");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Файл слишком большой. Максимум: 5 МБ");
        return;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${UPLOAD_URL}/upload`, { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          filePath = data.filePath;
        } else {
          toast.error("Не удалось загрузить файл");
          return;
        }
      } catch {
        toast.error("Сетевая ошибка при загрузке файла");
        return;
      }
    }

    try {
      const subjectsRes = await fetch(`${API_URL}/subjects?name=${encodeURIComponent(name)}`);
      const subjects = await subjectsRes.json();
      let subjectId;

      if (subjects.length > 0) {
        subjectId = subjects[0].id;
      } else {
        const newSubRes = await fetch(`${API_URL}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const newSub = await newSubRes.json();
        subjectId = newSub.id;
      }

      await fetch(`${API_URL}/teacher_subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: user.id, subjectId }),
      });

      const courseRes = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subjectId, teacherId: user.id, classId, deadline }),
      });

      if (!courseRes.ok) {
        toast.error("Не удалось добавить курс");
        return;
      }

      const course = await courseRes.json();

      if (filePath) {
        await fetch(`${API_URL}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id, filePath, fileName: file.name }),
        });
      }

      dispatch(addCourse(course));
      toast.success("Курс успешно добавлен!");
      navigate("/courses");
    } catch {
      toast.error("Сетевая ошибка при добавлении курса");
    }
  }

  if (user?.role !== "teacher") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Добавить курс</h2>
              {isLoadingClasses ? (
                <p className="text-center">Загрузка классов...</p>
              ) : classes.length === 0 ? (
                <p className="text-center text-danger">Классы не найдены.</p>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Название курса</label>
                    <input type="text" id="name" className="form-control"
                      value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="class" className="form-label">Класс</label>
                    <select id="class" className="form-select"
                      value={classId} onChange={(e) => setClassId(e.target.value)} required>
                      <option value="">-- Выберите класс --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="deadline" className="form-label">Дедлайн курса</label>
                    <input type="date" id="deadline" className="form-control"
                      value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="file" className="form-label">
                      Прикрепить файл (опционально, JPEG, PNG, PDF, до 5 МБ)
                    </label>
                    <input type="file" id="file" className="form-control"
                      onChange={(e) => setFile(e.target.files[0])} />
                  </div>
                  <button type="submit" className="btn btn-primary w-100">Добавить</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCourse;