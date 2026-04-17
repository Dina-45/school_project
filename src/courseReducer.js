const initialState = {
  courses: [],
  filteredCourses: [],
  loading: false,
  error: null,
};

function courseReducer(state = initialState, action) {
  switch (action.type) {

    case "FETCH_COURSES_REQUEST":
      return { ...state, loading: true, error: null };

    case "FETCH_COURSES_SUCCESS":
      return {
        ...state,
        loading: false,
        courses: action.payload,
        filteredCourses: action.payload,
      };

    case "FETCH_COURSES_FAILURE":
      return { ...state, loading: false, error: action.payload };

    case "FILTER_COURSES_BY_CLASS":

      return {
        ...state,
        filteredCourses: state.courses.filter(
          (course) => String(course.classId) === String(action.payload)
        ),
      };

    case "ADD_COURSE": {
      const updatedCourses = [...state.courses, action.payload];
      return {
        ...state,
        courses: updatedCourses,
        filteredCourses: updatedCourses,
      };
    }

    case "UPDATE_COURSE": {
      const updated = state.courses.map((course) =>
        String(course.id) === String(action.payload.id) ? action.payload : course
      );
      return { ...state, courses: updated, filteredCourses: updated };
    }

    case "DELETE_COURSE": {
      const remaining = state.courses.filter(
        (course) => String(course.id) !== String(action.payload)
      );
      return { ...state, courses: remaining, filteredCourses: remaining };
    }

    default:
      return state;
  }
}

export default courseReducer;


export const fetchCoursesRequest = () => ({ type: "FETCH_COURSES_REQUEST" });
export const fetchCoursesSuccess = (courses) => ({ type: "FETCH_COURSES_SUCCESS", payload: courses });
export const fetchCoursesFailure = (error) => ({ type: "FETCH_COURSES_FAILURE", payload: error });
export const filterCoursesByClass = (classId) => ({ type: "FILTER_COURSES_BY_CLASS", payload: classId });
export const addCourse = (course) => ({ type: "ADD_COURSE", payload: course });
export const updateCourse = (course) => ({ type: "UPDATE_COURSE", payload: course });
export const deleteCourse = (courseId) => ({ type: "DELETE_COURSE", payload: courseId });