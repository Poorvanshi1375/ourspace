import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./auth";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ScrapbookPage from "./pages/ScrapbookPage";
import ProfilePage from "./pages/ProfilePage";
import GalleryPage from "./pages/GalleryPage";
import NotesListPage from "./pages/NotesListPage";
import NewNotePage from "./pages/NewNotePage";
import ReadNotePage from "./pages/ReadNotePage";
import CameraPage from "./pages/CameraPage";
import NewMemoryPage from "./pages/NewMemoryPage";
import UploadMemoryPage from "./pages/UploadMemoryPage";

// ✅ NEW
import SpaceChoicePage from "./pages/SpaceChoicePage";
import CreateSpacePage from "./pages/CreateSpacePage";
import JoinSpacePage from "./pages/JoinSpacePage";

/* ---------- PROTECTED ROUTE ---------- */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

/* ---------- SPACE GATE ---------- */
function SpaceGate() {
  const { user, activeSpaceCode, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (!activeSpaceCode) {
    return <Navigate to="/space" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Space Gate (decides dashboard vs space choice) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <SpaceGate />
              </ProtectedRoute>
            }
          />

          {/* Space setup */}
          <Route
            path="/space"
            element={
              <ProtectedRoute>
                <SpaceChoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/space/create"
            element={
              <ProtectedRoute>
                <CreateSpacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/space/join"
            element={
              <ProtectedRoute>
                <JoinSpacePage />
              </ProtectedRoute>
            }
          />

          {/* Main App */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Scrapbook ONLY opens from calendar */}
          <Route
            path="/scrapbook/:date"
            element={
              <ProtectedRoute>
                <ScrapbookPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/memory/new"
            element={
              <ProtectedRoute>
                <NewMemoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/camera"
            element={
              <ProtectedRoute>
                <CameraPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes/new"
            element={
              <ProtectedRoute>
                <NewNotePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes/:id"
            element={
              <ProtectedRoute>
                <ReadNotePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery/:date"
            element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload/memory"
            element={
              <ProtectedRoute>
                <UploadMemoryPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
