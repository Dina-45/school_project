import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../authReducer";
import { useState } from "react";
import Modal from "../components/Modal";

function Navbar() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);


  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    dispatch(logout());
    setIsLogoutModalOpen(false);
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">School App</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">Главная</Link>
            </li>
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Личный кабинет</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/courses">Курсы</Link>
                </li>
                {user.role === "student" && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/enrollments">Мои записи</Link>
                  </li>
                )}
                {user.role === "teacher" && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/add-course">Добавить курс</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/add-test">Добавить тест</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/teacher-courses">Мои курсы</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/course-reviews">Отзывы</Link>
                    </li>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin">Панель админа</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/reports">Отчеты</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/announcements">Объявления</Link>
                    </li>
                  </>
                )}
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Вход</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Регистрация</Link>
                </li>
              </>
            )}
          </ul>
          {user && (
            <div className="d-flex align-items-center">
              <img
                src={user.avatar || "/default-avatar.png"}
                alt="Avatar"
                className="rounded-circle me-2"
                style={{ width: "40px", height: "40px" }}
              />
              <button
                onClick={handleLogoutClick}
                className="btn btn-outline-light"
                aria-label="Выйти из аккаунта"
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        message="Вы уверены, что хотите выйти?"
      />
    </nav>
  );
}

export default Navbar;