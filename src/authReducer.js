const initialState = {
  user: (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage:", e);
      return null;
    }
  })(),
};

function authReducer(state = initialState, action) {
  switch (action.type) {
    case "LOGIN":
      const newUser = action.payload;
      localStorage.setItem("user", JSON.stringify(newUser));
      return { ...state, user: newUser };
    case "LOGOUT":
      localStorage.removeItem("user");
      localStorage.removeItem("reduxState");
      return { ...state, user: null };
    case "UPDATE_USER":
      const updatedUser = action.payload;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { ...state, user: updatedUser };
    default:
      return state;
  }
}

export default authReducer;
export const login = (user) => ({ type: "LOGIN", payload: user });
export const logout = () => ({ type: "LOGOUT" });
export const updateUser = (user) => ({ type: "UPDATE_USER", payload: user });