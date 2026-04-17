import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

function Home() {
  const user = useSelector((state) => state.auth.user);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetch("http://localhost:3001/announcements")
        .then((res) => res.json())
        .then((data) => setAnnouncements(data))
        .catch((error) => toast.error("Ошибка загрузки объявлений"));
      fetch(`http://localhost:3001/notifications?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => setNotifications(data))
        .catch((error) => toast.error("Ошибка загрузки уведомлений"));
    }
  }, [user]);

  return (
    <div className="container mt-5">
      <div className="hero-section text-center mb-5">
        <h1 className="title">Система обучения</h1>
        <p className="lead">
          {user
            ? `Добро пожаловать, ${user.name}!`
            : "Войдите или зарегистрируйтесь!"}
        </p>
      </div>

      <div className="card shadow mb-4">
        <div className="card-body text-center">
          {user ? (
            <>
              <h2 className="mb-3">Ваш личный кабинет</h2>
              <p className="lead2">
                Вы вошли как <strong>{user.role}</strong>. Выберите действие ниже:
              </p>
              <div className="auth-section">
                <Link to="/dashboard" className="btn btn-primary">
                  Личный кабинет
                </Link>
                <Link to="/courses" className="btn btn-primary">
                  {user.role === "teacher" ? "Курсы" : "Доступные курсы"}
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" className="btn btn-primary">
                    Панель администратора
                  </Link>
                )}
                {user.role === "student" && (
                  <Link to="/enrollments" className="btn btn-primary">
                    Мои записи
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="auth-section">
              <Link to="/login" className="btn btn-primary">
                Войти
              </Link>
              <Link to="/register" className="btn btn-primary">
                Зарегистрироваться
              </Link>
            </div>
          )}
        </div>
      </div>

      {user && (
        <>
          <div className="card shadow mb-4">
            <div className="card-body">
              <h2 className="mb-3">Объявления</h2>
              {announcements.length === 0 ? (
                <p className="lead">Объявлений нет</p>
              ) : (
                <ul className="list-group">
                  {announcements.slice(0, 3).map((announcement) => (
                    <li
                      key={announcement.id}
                      className="list-group-item"
                      style={{ transition: "transform 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <strong>{announcement.title}</strong>
                      <p>{announcement.message}</p>
                      <small>
                        {new Date(announcement.createdAt).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card shadow mb-4">
            <div className="card-body">
              <h2 className="mb-3">Ваши уведомления</h2>
              {notifications.length === 0 ? (
                <p className="lead">Уведомлений нет</p>
              ) : (
                <ul className="list-group">
                  {notifications.slice(0, 3).map((notification) => (
                    <li
                      key={notification.id}
                      className="list-group-item"
                      style={{ transition: "transform 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      {notification.message}
                      <br />
                      <small>
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
