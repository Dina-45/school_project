import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../authReducer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/users?email=${email}`);
      const users = await response.json();

      if (users.length === 0) {
        toast.error("Пользователь с таким email не найден. Попробуйте зарегистрироваться или проверьте email.", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      const user = users[0];

      if (user.isBanned) {
        toast.error("Ваш аккаунт заблокирован администратором. Обратитесь в поддержку для разблокировки.", {
          position: "top-center",
          autoClose: 7000,
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        dispatch(login(user));
        toast.success("Успешный вход!", {
          position: "top-center",
          autoClose: 3000,
        });
        navigate("/");
      } else {
        toast.error("Неверный пароль. Попробуйте снова или используйте функцию восстановления пароля.", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error("Ошибка при входе. Проверьте подключение к интернету и попробуйте снова.", {
        position: "top-center",
        autoClose: 5000,
      });
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Вход</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Пароль</label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Войти</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
