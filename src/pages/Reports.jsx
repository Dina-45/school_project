import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function Reports() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [grades, setGrades] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [teacherActivity, setTeacherActivity] = useState([]);
  const [studentActivity, setStudentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, classesResponse, coursesResponse, testsResponse, gradesResponse, enrollmentsResponse] = await Promise.all([
          fetch("http://localhost:3001/users"),
          fetch("http://localhost:3001/classes"),
          fetch("http://localhost:3001/courses"),
          fetch("http://localhost:3001/tests"),
          fetch("http://localhost:3001/grades"),
          fetch("http://localhost:3001/enrollments"),
        ]);

        if (!usersResponse.ok) throw new Error("Не удалось загрузить пользователей");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        if (!classesResponse.ok) throw new Error("Не удалось загрузить классы");
        const classesData = await classesResponse.json();
        setClasses(classesData);

        if (!coursesResponse.ok) throw new Error("Не удалось загрузить курсы");
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        if (!testsResponse.ok) throw new Error("Не удалось загрузить тесты");
        const testsData = await testsResponse.json();
        setTests(testsData);

        if (!gradesResponse.ok) throw new Error("Не удалось загрузить оценки");
        const gradesData = await gradesResponse.json();
        setGrades(gradesData);

        if (!enrollmentsResponse.ok) throw new Error("Не удалось загрузить записи");
        const enrollmentsData = await enrollmentsResponse.json();
        setEnrollments(enrollmentsData);

        console.log("Loaded data:", {
          users: usersData,
          classes: classesData,
          courses: coursesData,
          tests: testsData,
          grades: gradesData,
          enrollments: enrollmentsData,
        });
      } catch (error) {
        toast.error("Ошибка загрузки данных: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const calculateClassPerformance = async () => {
      const performancePromises = classes.map(async (cls) => {
        const classStudents = users.filter(
          (u) => u.role === "student" && String(u.classId) === String(cls.id)
        );
        console.log(`Class ${cls.name} students:`, classStudents);

        if (!classStudents.length) {
          return { className: cls.name, averageScore: "Нет студентов" };
        }

        const gradesPromises = classStudents.map(async (student) => {
          try {
            const response = await fetch(`http://localhost:3001/grades?studentId=${encodeURIComponent(student.id)}`);
            if (!response.ok) throw new Error("Не удалось загрузить оценки");
            const grades = await response.json();
            return grades.map((g) => parseFloat(g.score)).filter((score) => !isNaN(score));
          } catch (error) {
            console.error(`Ошибка загрузки оценок для студента ${student.id}:`, error);
            return [];
          }
        });

        const classGradesArrays = await Promise.all(gradesPromises);
        const classGrades = classGradesArrays.flat();
        console.log(`Class ${cls.name} grades:`, classGrades);

        const averageScore = classGrades.length
          ? (classGrades.reduce((sum, score) => sum + score, 0) / classGrades.length).toFixed(2)
          : "Нет оценок";

        return { className: cls.name, averageScore };
      });

      try {
        const performanceData = await Promise.all(performancePromises);
        setClassPerformance(performanceData);
        console.log("Class performance:", performanceData);
      } catch (error) {
        toast.error("Ошибка при расчете успеваемости классов: " + error.message);
      }
    };

    const calculateTeacherActivity = () => {
      const activity = users
        .filter((u) => u.role === "teacher")
        .map((teacher) => {
          const teacherCourses = courses.filter((c) => c.teacherId === teacher.id);
          const teacherTests = tests.filter((t) =>
            teacherCourses.some((c) => c.id === t.courseId)
          );
          return {
            teacherName: teacher.name,
            courseCount: teacherCourses.length,
            testCount: teacherTests.length,
          };
        });
      setTeacherActivity(activity);
      console.log("Teacher activity:", activity);
    };

    const calculateStudentActivity = () => {
      const activity = users
        .filter((u) => u.role === "student")
        .map((student) => {
          const studentEnrollments = enrollments.filter(
            (e) => e.studentId === student.id
          );
          const studentCourses = studentEnrollments.length;
          const studentCompletedTests = grades.filter(
            (g) => g.studentId === student.id
          ).length;

          return {
            studentName: student.name,
            courseCount: studentCourses,
            completedTests: studentCompletedTests,
          };
        });
      setStudentActivity(activity);
      console.log("Student activity:", activity);
    };

    if (users.length && classes.length && courses.length && tests.length && grades.length && enrollments.length) {
      calculateClassPerformance();
      calculateTeacherActivity();
      calculateStudentActivity();
    } else {
      console.log("Data incomplete:", {
        users: users.length,
        classes: classes.length,
        courses: courses.length,
        tests: tests.length,
        grades: grades.length,
        enrollments: enrollments.length,
      });
    }
  }, [users, classes, courses, tests, grades, enrollments]);

  if (user?.role !== "admin") {
    return <div className="container mt-5"><h1>Доступ запрещен</h1></div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Отчеты</h1>
      <h3>Успеваемость классов</h3>
      {isLoading ? (
        <p>Загрузка данных...</p>
      ) : classPerformance.length === 0 ? (
        <p className="text-muted">Нет данных о классах или оценках.</p>
      ) : (
        <ul className="list-group mb-4">
          {classPerformance.map((courseData, index) => (
            <li key={index} className="list-group-item">
              <strong>Класс:</strong> {courseData.className} |{" "}
              <strong>Средний балл:</strong> {courseData.averageScore}
            </li>
          ))}
        </ul>
      )}
      <h3>Активность преподавателей</h3>
      {isLoading ? (
        <p>Загрузка данных...</p>
      ) : teacherActivity.length === 0 ? (
        <p className="text-muted">Нет данных о преподавателях.</p>
      ) : (
        <ul className="list-group mb-4">
          {teacherActivity.map((activity, index) => (
            <li key={index} className="list-group-item">
              <strong>Преподаватель:</strong> {activity.teacherName} |{" "}
              <strong>Курсов:</strong> {activity.courseCount} |{" "}
              <strong>Тестов:</strong> {activity.testCount}
            </li>
          ))}
        </ul>
      )}
      <h3>Активность учеников</h3>
      {isLoading ? (
        <p>Загрузка данных...</p>
      ) : studentActivity.length === 0 ? (
        <p className="text-muted">Нет данных об учениках.</p>
      ) : (
        <ul className="list-group mb-4">
          {studentActivity.map((activity, index) => (
            <li key={index} className="list-group-item">
              <strong>Ученик:</strong> {activity.studentName} |{" "}
              <strong>Курсов:</strong> {activity.courseCount} |{" "}
              <strong>Пройденных тестов:</strong> {activity.completedTests}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Reports;