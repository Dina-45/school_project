import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { updateCourse, deleteCourse } from "../courseReducer";
import { API_URL, UPLOAD_URL } from "../api";

function EditCourse() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);
  const [existingFiles, setExistingFiles] = useState([]);
  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data);
        setName(data.name);
        setSubjectId(data.subjectId);
        setClassId(data.classId);
        setDeadline(data.deadline);
      })
      .catch(() => toast.error("Ошибка загрузки курса"));

    fetch(`${API_URL}/files?courseId=${id}`)
      .then((res) => res.json())
      .then((data) => setExistingFiles(data))
      .catch(() => toast.error("Ошибка загрузки файлов"));

    fetch(`${API_URL}/teacher_subjects?teacherId=${user.id}`)
      .then((res) => res.json())
      .then(async (teacherSubjects) => {
        const subjectIds = teacherSubjects.map((ts) => ts.subjectId);
        const allSubjectsRes = await fetch(`${API_URL}/subjects`);
        const allSubjects = await allSubjectsRes.json();
        setSubjects(allSubjects.filter((s) => subjectIds.includes(s.id)));
      })
      .catch(() => toast.error("Ошибка загрузки предметов"));

    fetch(`${API_URL}/classes`)
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch(() => toast.error("Ошибка загрузки классов"));
  }, [id, user.id]);

  async function handleSubmit(e) {
    e.preventDefault();
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
      const updatedCourse = { id, name, subjectId, classId, teacherId: user.id, deadline };

      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCourse),
      });

      if (res.ok) {
        if (filePath) {
          await fetch(`${API_URL}/files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId: id, filePath, fileName: file.name }),
          });
        }
        dispatch(updateCourse(updatedCourse));
        toast.success("Курс успешно обновлен!");
        navigate("/courses");
      } else {
        toast.error("Не удалось обновить курс");
      }
    } catch {
      toast.error("Сетевая ошибка при обновлении курса");
    }
  }

  async function handleDelete() {
    try {
      // Delete enrollments first
      const enrollRes = await fetch(`${API_URL}/enrollments?courseId=${id}`);
      const enrollments = await enrollRes.json();
      for (const e of enrollments) {
        await fetch(`${API_URL}/enrollments/${e.id}`, { method: "DELETE" });
      }

      // Delete files
      const filesRes = await fetch(`${API_URL}/files?courseId=${id}`);
      const files = await filesRes.json();
      for (const f of files) {
        await fetch(`${API_URL}/files/${f.id}`, { method: "DELETE" });
      }

      const res = await fetch(`${API_URL}/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        dispatch(deleteCourse(id));
        toast.success("Курс успешно удален!");
        navigate("/courses");
      } else {
        toast.error("Не удалось удалить курс");
      }
    } catch {
      toast.error("Сетевая ошибка при удалении курса");
    }
  }

  if (user?.role !== "teacher") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  if (course && String(course.teacherId) !== String(user.id)) {
    return <div className="container mt-5"><h1>Вы не можете редактировать этот курс</h1></div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Редактировать курс</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Название курса</label>
                  <input type="text" id="name" className="form-control"
                    value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="subject" className="form-label">Предмет</label>
                  <select id="subject" className="form-select"
                    value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                    <option value="">-- Выберите предмет --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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
                    Добавить новый файл (JPEG, PNG, PDF, до 5 МБ)
                  </label>
                  <input type="file" id="file" className="form-control"
                    onChange={(e) => setFile(e.target.files[0])} />
                </div>
                {existingFiles.length > 0 && (
                  <div className="mb-3">
                    <h5>Существующие файлы:</h5>
                    <ul className="list-group">
                      {existingFiles.map((f) => (
                        <li key={f.id} className="list-group-item">
                          <a href={`${UPLOAD_URL}${f.filePath}`} download>{f.fileName}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="d-flex justify-content-between">
                  <button type="submit" className="btn btn-primary w-100 me-2">Обновить</button>
                  <button type="button" onClick={handleDelete} className="btn btn-danger w-100">
                    Удалить курс
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditCourse;