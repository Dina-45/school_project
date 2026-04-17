import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetch("http://localhost:3001/announcements")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .catch((error) => toast.error("Ошибка загрузки объявлений"));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Заполните все поля!");
      return;
    }

    const newAnnouncement = {
      title,
      message,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("http://localhost:3001/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement),
      });

      if (response.ok) {
        const announcement = await response.json();
        setAnnouncements([...announcements, announcement]);
        setTitle("");
        setMessage("");
        const users = await fetch("http://localhost:3001/users").then((res) => res.json());
        for (const u of users) {
          await fetch("http://localhost:3001/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: u.id,
              message: `Новое объявление: ${title} - ${message}`,
              createdAt: new Date().toISOString(),
            }),
          });
        }
        toast.success("Объявление создано!");
      } else {
        toast.error("Не удалось создать объявление");
      }
    } catch (error) {
      toast.error("Сетевая ошибка при создании объявления");
    }
  }

  if (user?.role !== "admin") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Управление объявлениями</h1>
      <div className="card mb-4">
        <div className="card-body">
          <h3>Создать объявление</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Заголовок</label>
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
              <label htmlFor="message" className="form-label">Сообщение</label>
              <textarea
                id="message"
                className="form-control"
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Создать</button>
          </form>
        </div>
      </div>
      <h3>Существующие объявления</h3>
      {announcements.length === 0 ? (
        <p>Объявлений нет.</p>
      ) : (
        <ul className="list-group">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="list-group-item">
              <strong>{announcement.title}</strong>
              <p>{announcement.message}</p>
              <small>Создано: {new Date(announcement.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Announcements;