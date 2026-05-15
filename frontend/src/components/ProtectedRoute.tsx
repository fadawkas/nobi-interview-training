import { Navigate, Outlet } from "react-router-dom"

const AUTH_TOKEN_KEY = "nobiai_auth_token"

export default function ProtectedRoute() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  
  if (!token) {
    return <Navigate to="/signin" replace />
  }
  
  return <Outlet />
}
