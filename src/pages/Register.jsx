import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [classId, setClassId] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const adminResponse = await fetch(`http://localhost:3001/users?role=admin`);
      const admins = await adminResponse.json();
      const adminLimit = 2;

      if (role === "admin" && admins.length >= adminLimit) {
        toast.error(`Лимит администраторов (${adminLimit}) достигнут. Пожалуйста, обратитесь к текущему администратору для регистрации.`, {
          position: "top-center",
          autoClose: 7000,
        });
        return;
      }

      const response = await fetch(`http://localhost:3001/users?email=${email}`);
      const users = await response.json();
      if (users.length > 0) {
        toast.error("Пользователь с таким email уже существует. Попробуйте войти или используйте другой email.", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      let avatarPath = null;
      if (avatar) {
        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 2 * 1024 * 1024;

        if (!allowedTypes.includes(avatar.type)) {
          toast.error("Допустимы только изображения (JPEG, PNG). Пожалуйста, выберите другой файл.", {
            position: "top-center",
            autoClose: 5000,
          });
          return;
        }

        if (avatar.size > maxSize) {
          toast.error("Файл слишком большой. Максимальный размер: 2 МБ. Сжмите изображение и попробуйте снова.", {
            position: "top-center",
            autoClose: 5000,
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", avatar);
        const uploadResponse = await fetch("http://localhost:3002/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (uploadResponse.ok) {
          avatarPath = uploadData.filePath;
        } else {
          toast.error("Не удалось загрузить аватар. Проверьте файл и попробуйте снова.", {
            position: "top-center",
            autoClose: 5000,
          });
          return;
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        name,
        email,
        password: hashedPassword,
        role,
        classId: role === "student" ? parseInt(classId) : null,
        avatar: avatarPath,
        isBanned: false,
      };

      const res = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        toast.success("Успешная регистрация! Теперь вы можете войти.", {
          position: "top-center",
          autoClose: 3000,
        });
        navigate("/login");
      } else {
        toast.error("Ошибка при регистрации. Попробуйте снова позже.", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error("Сетевая ошибка при регистрации. Проверьте подключение и попробуйте снова.", {
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
              <h2 className="card-title text-center mb-4">Регистрация</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Имя</label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
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
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Роль</label>
                  <select
                    id="role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="student">Студент</option>
                    <option value="teacher">Преподаватель</option>
                  </select>
                </div>
                {role === "student" && (
                  <div className="mb-3">
                    <label htmlFor="class" className="form-label">Класс</label>
                    <select
                      id="class"
                      className="form-select"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      required
                    >
                      <option value="">-- Выберите класс --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="avatar" className="form-label">Аватар (опционально, JPEG, PNG, до 2 МБ)</label>
                  <input
                    type="file"
                    id="avatar"
                    className="form-control"
                    onChange={(e) => setAvatar(e.target.files[0])}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Зарегистрироваться</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
