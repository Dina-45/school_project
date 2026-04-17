import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateUser } from "../authReducer";
import { API_URL, UPLOAD_URL } from "../api";

function Dashboard() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(null);
  const [classId, setClassId] = useState(user?.classId || "");
  const [classes, setClasses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/notifications?userId=${user.id}`)
      .then((res) => res.json()).then(setNotifications)
      .catch(() => toast.error("Ошибка загрузки уведомлений"));

    fetch(`${API_URL}/announcements`)
      .then((res) => res.json()).then(setAnnouncements)
      .catch(() => toast.error("Ошибка загрузки объявлений"));

    if (user.role === "student" || user.role === "teacher") {
      fetch(`${API_URL}/classes`)
        .then((res) => res.json()).then(setClasses)
        .catch(() => toast.error("Ошибка загрузки классов"));
    }

    if (user.role === "student") {
      fetch(`${API_URL}/grades?studentId=${user.id}`)
        .then((res) => res.json()).then(setGrades)
        .catch(() => toast.error("Ошибка загрузки оценок"));
    }
  }, [user.id, user.role]);

  async function handleUpdate(e) {
    e.preventDefault();
    let avatarPath = user.avatar;

    if (avatar) {
      if (!["image/jpeg", "image/png"].includes(avatar.type)) {
        toast.error("Допустимы только JPEG или PNG");
        return;
      }
      if (avatar.size > 2 * 1024 * 1024) {
        toast.error("Максимальный размер: 2 МБ");
        return;
      }
      try {
        const formData = new FormData();
        formData.append("file", avatar);
        const res = await fetch(`${UPLOAD_URL}/upload`, { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          avatarPath = data.filePath;
        } else {
          toast.error("Не удалось загрузить аватар");
          return;
        }
      } catch {
        toast.error("Сетевая ошибка при загрузке аватара");
        return;
      }
    }

    const updatedUser = {
      id: user.id,
      name,
      email,
      avatar: avatarPath,
      classId: user.role === "student" ? String(classId) || null : null,
      role: user.role,
      isBanned: user.isBanned,
      password: user.password,
    };

    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      if (res.ok) {
        dispatch(updateUser(updatedUser));
        toast.success("Данные обновлены!");
        setIsEditing(false);
      } else {
        toast.error("Не удалось обновить данные");
      }
    } catch {
      toast.error("Сетевая ошибка при обновлении данных");
    }
  }

  if (!user) return <div className="container mt-5"><h1>Пожалуйста, войдите</h1></div>;

  return (
    <div className="container mt-5">
      <div className="hero-section text-center mb-5">
        <h1 className="title">Личный кабинет</h1>
        <p className="lead">Добро пожаловать, {user.name}!</p>
      </div>

      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="user-profile text-center mb-4">
            <img src={user.avatar || "/default-avatar.png"} alt="Аватар"
              className="rounded-circle avatar-lg mb-3" />
          </div>
          {!isEditing ? (
            <div className="user-info">
              <p><strong>Имя:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Роль:</strong> {user.role}</p>
              {user.classId && (
                <p>
                  <strong>Класс: </strong>
                  {/* FIX: Use String() to compare IDs — classId may be number or string */}
                  {classes.find((c) => String(c.id) === String(user.classId))?.name || "Неизвестно"}
                </p>
              )}
              <div className="text-center mt-4">
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  Редактировать
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Имя</label>
                <input type="text" id="name" className="form-control"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input type="email" id="email" className="form-control"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {user.role === "student" && (
                <div className="mb-3">
                  <label htmlFor="classId" className="form-label">Класс</label>
                  <select id="classId" className="form-select"
                    value={classId} onChange={(e) => setClassId(e.target.value)}>
                    <option value="">-- Выберите класс --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="avatar" className="form-label">Аватар (JPEG/PNG, до 2 МБ)</label>
                <input type="file" id="avatar" className="form-control"
                  onChange={(e) => setAvatar(e.target.files[0])} />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {user.role === "student" && grades.length > 0 && (
        <div className="card shadow mb-4">
          <div className="card-body">
            <h2>Мои оценки</h2>
            <ul className="list-group">
              {grades.map((g) => (
                <li key={g.id} className="list-group-item">
                  Курс: {g.courseId} | Тест: {g.testId} | Оценка: {g.score} |{" "}
                  {new Date(g.createdAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card shadow mb-4">
        <div className="card-body">
          <h2>Уведомления</h2>
          {notifications.length === 0 ? <p>Уведомлений нет</p> : (
            <ul className="list-group">
              {notifications.map((n) => (
                <li key={n.id} className="list-group-item">
                  {n.message}<br /><small>{new Date(n.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <h2>Объявления</h2>
          {announcements.length === 0 ? <p>Объявлений нет</p> : (
            <ul className="list-group">
              {announcements.map((a) => (
                <li key={a.id} className="list-group-item">
                  <strong>{a.title}</strong>
                  <p>{a.message}</p>
                  <small>{new Date(a.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;