
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import {
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  filterCoursesByClass,
  deleteCourse,
} from "../courseReducer";
import { API_URL } from "../api";

function Courses() {
  const { filteredCourses = [], loading, error } = useSelector((state) => state.courses || {});
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      dispatch(fetchCoursesRequest());
      try {
        const res = await fetch(`${API_URL}/courses`);
        if (!res.ok) throw new Error("Не удалось загрузить курсы");
        const data = await res.json();

      
        const unique = Array.from(new Map(data.map((c) => [c.id, c])).values());
        dispatch(fetchCoursesSuccess(unique));

  
        if (user?.role === "student") {
          dispatch(filterCoursesByClass(user.classId));
        }
      } catch (err) {
        dispatch(fetchCoursesFailure(err.message));
        toast.error("Ошибка загрузки курсов");
      }
    };
    fetchCourses();
  }, [dispatch, user]);

  function openDeleteModal(courseId) {
    setCourseToDelete(courseId);
    setIsModalOpen(true);
  }

  async function handleDelete() {
    try {
      const enrollRes = await fetch(`${API_URL}/enrollments?courseId=${courseToDelete}`);
      const enrollments = await enrollRes.json();
      for (const e of enrollments) {
        await fetch(`${API_URL}/enrollments/${e.id}`, { method: "DELETE" });
      }

      const filesRes = await fetch(`${API_URL}/files?courseId=${courseToDelete}`);
      const files = await filesRes.json();
      for (const f of files) {
        await fetch(`${API_URL}/files/${f.id}`, { method: "DELETE" });
      }


      const res = await fetch(`${API_URL}/courses/${courseToDelete}`, { method: "DELETE" });

      if (res.ok) {
        dispatch(deleteCourse(courseToDelete));
        toast.success("Курс успешно удален!");
      } else {
        toast.error("Не удалось удалить курс");
      }
    } catch (err) {
      toast.error("Сетевая ошибка при удалении курса");
    }
    setIsModalOpen(false);
  }

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5">Ошибка: {error}</div>;
  if (!filteredCourses.length) return <div className="container mt-5">Курсы не найдены</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Доступные курсы</h1>
      {user?.role === "teacher" && (
        <div className="mb-4">
          <Link to="/add-course" className="btn btn-success">Добавить курс</Link>
        </div>
      )}
      <ul className="list-group">
        {filteredCourses.map((course) => (
          <li key={course.id} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{course.name}</span>
            {/* Teacher can only edit/delete their own courses */}
            {user?.role === "teacher" && String(course.teacherId) === String(user.id) && (
              <div>
                <Link to={`/edit-course/${course.id}`} className="btn btn-warning btn-sm me-2">
                  Редактировать
                </Link>
                <button onClick={() => openDeleteModal(course.id)} className="btn btn-danger btn-sm">
                  Удалить
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        message="Вы уверены, что хотите удалить этот курс?"
      />
    </div>
  );
}

export default Courses;