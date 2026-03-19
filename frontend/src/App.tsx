import { Route, Routes } from "react-router-dom";

import LoginPage from "./components/auth/login/loginPage";
import RegisterPage from "./components/auth/register/registerPage";
import Dashboard from "./components/dashboard/dashboardLayout";
import ProtectedRoute from "./context/ProtectedRoute";
import BoardGrid from "./components/dashboard/boards/BoardGrid";
import ProfilePage from "./components/dashboard/profile/profilePage";
import SettingsPage from "./components/dashboard/settings/settingsPage";
import BoardPage from "./components/drawBoard/canvas/BoardPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<BoardGrid />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/board/:boardId" element={<BoardPage />} />
    </Routes>
  );
}

export default App;
