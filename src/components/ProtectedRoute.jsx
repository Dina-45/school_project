import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children, allowedRoles }) {
  const user = useSelector(state => state.auth.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.isBanned) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default ProtectedRoute;