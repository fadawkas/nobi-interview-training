import { Route, Routes } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import History from "./pages/History"
import Landing from "./pages/Landing"
import SessionResults from "./pages/SessionResult"
import SessionLive from "./pages/SessionLive"
import Profile from "./pages/Profile"
import SessionSetup from "./pages/SessionSetup"
import SignIn from "./pages/SignIn"
import SignUp from "./pages/SignUp"
import ProtectedRoute from "./components/ProtectedRoute"
import GuestRoute from "./components/GuestRoute"

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/session/setup" element={<SessionSetup />} />
        <Route path="/session/live" element={<SessionLive />} />
        <Route path="/results/:sessionId" element={<SessionResults />} />
      </Route>
    </Routes>
  )
}

export default App