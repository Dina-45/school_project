import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import { logout } from "../authReducer";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedIsBanned, setSelectedIsBanned] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:3001/users");
        if (!response.ok) {
          throw new Error("Ошибка загрузки пользователей");
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        toast.error("Ошибка загрузки пользователей");
      }
    };
    fetchUsers();
  }, []);

  function openBanModal(userId, isBanned) {
    setSelectedUserId(userId);
    setSelectedIsBanned(isBanned);
    setIsBanModalOpen(true);
  }

  function openRoleModal(userId, newRole) {
    setSelectedUserId(userId);
    setSelectedNewRole(newRole);
    setIsRoleModalOpen(true);
  }

  async function handleBanToggle() {
    try {
      const response = await fetch(`http://localhost:3001/users/${selectedUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !selectedIsBanned }),
      });
      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === selectedUserId ? { ...u, isBanned: !selectedIsBanned } : u
          )
        );
        toast.success(`Пользователь ${selectedIsBanned ? "разбанен" : "забанен"}!`);
        if (selectedUserId === user.id && !selectedIsBanned) {
          dispatch(logout());
          toast.info("Вы были заблокированы и вышли из системы.");
        }
      } else {
        toast.error("Не удалось изменить статус бана");
      }
    } catch (error) {
      toast.error("Сетевая ошибка");
    }
    setIsBanModalOpen(false);
    setSelectedUserId(null);
    setSelectedIsBanned(null);
  }

  async function handleRoleChange() {
    const currentAdminsCount = users.filter((u) => u.role === "admin").length;
    const selectedUser = users.find((u) => u.id === selectedUserId);

    if (selectedNewRole === "admin" && currentAdminsCount >= 2 && selectedUser.role !== "admin") {
      toast.error("Нельзя назначить больше двух администраторов!");
      setIsRoleModalOpen(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/users/${selectedUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedNewRole }),
      });
      if (response.ok) {
        setUsers(
          users.map((u) => (u.id === selectedUserId ? { ...u, role: selectedNewRole } : u))
        );
        toast.success("Роль изменена!");
        if (selectedUserId === user.id) {
          dispatch(logout());
          toast.info("Ваша роль была изменена. Пожалуйста, войдите снова.");
        }
      } else {
        toast.error("Не удалось изменить роль");
      }
    } catch (error) {
      toast.error("Сетевая ошибка");
    }
    setIsRoleModalOpen(false);
    setSelectedUserId(null);
    setSelectedNewRole(null);
  }

  if (!user || user.role !== "admin") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  const currentAdminsCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Панель администратора</h1>
      <h3>Управление пользователями</h3>
      <table className="table table-striped mb-4">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => openRoleModal(u.id, e.target.value)}
                  className="form-select"
                  disabled={u.id === user.id}
                >
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin" disabled={currentAdminsCount >= 2 && u.role !== "admin"}>
                    Администратор
                  </option>
                </select>
              </td>
              <td>{u.isBanned ? "Забанен" : "Активен"}</td>
              <td>
                <button
                  onClick={() => openBanModal(u.id, u.isBanned)}
                  className={`btn btn-sm ${u.isBanned ? "btn-success" : "btn-danger"}`}
                  disabled={u.id === user.id}
                >
                  {u.isBanned ? "Разбанить" : "Забанить"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setSelectedUserId(null);
          setSelectedIsBanned(null);
        }}
        onConfirm={handleBanToggle}
        message={`Вы уверены, что хотите ${selectedIsBanned ? "разбанить" : "забанить"} пользователя?`}
      />
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedUserId(null);
          setSelectedNewRole(null);
        }}
        onConfirm={handleRoleChange}
        message={`Вы уверены, что хотите изменить роль пользователя на "${selectedNewRole}"?`}
      />
    </div>
  );
}

export default AdminPanel;