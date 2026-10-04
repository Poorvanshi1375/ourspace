import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./auth";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import SpaceChoicePage from "./pages/SpaceChoicePage";
import CreateSpacePage from "./pages/CreateSpacePage";
import JoinSpacePage from "./pages/JoinSpacePage";
import MySpacePage from "./pages/MySpacePage";
import BooksPage from "./pages/BooksPage";
import SpreadEditorPage from "./pages/SpreadEditorPage";
import LettersPage from "./pages/LettersPage";
import TimelinePage from "./pages/TimelinePage";

/* ---------- PROTECTED ROUTE ---------- */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

const Protected = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

/* ---------- SPACE GATE ---------- */
function SpaceGate() {
  const { user, activeSpaceCode, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (!activeSpaceCode) {
    return <Navigate to="/space" replace />;
  }

  return <Navigate to="/home" replace />;
}

/* ---------- Old addresses (retired screens) ---------- */

/* An old scrapbook day -> that day's spread in the migrated "Our memories" book */
function OldScrapbookRedirect() {
  const { date } = useParams();
  const { activeSpaceCode, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!activeSpaceCode) return <Navigate to="/home" replace />;
  return <Navigate to={`/books/memories-${activeSpaceCode}?spread=day-${date}`} replace />;
}

/* An old letter link -> the same letter opened in Letters */
function OldLetterRedirect() {
  const { id } = useParams();
  return <Navigate to={`/letters?open=${id}`} replace />;
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

          {/* Decides home vs space setup */}
          <Route path="/app" element={Protected(<SpaceGate />)} />

          {/* Space setup */}
          <Route path="/space" element={Protected(<SpaceChoicePage />)} />
          <Route path="/space/create" element={Protected(<CreateSpacePage />)} />
          <Route path="/space/join" element={Protected(<JoinSpacePage />)} />

          {/* Main app */}
          <Route path="/home" element={Protected(<MySpacePage />)} />
          <Route path="/books" element={Protected(<BooksPage />)} />
          <Route path="/books/:bookId" element={Protected(<SpreadEditorPage />)} />
          <Route path="/letters" element={Protected(<LettersPage />)} />
          <Route path="/timeline" element={Protected(<TimelinePage />)} />
          <Route path="/profile" element={Protected(<ProfilePage />)} />

          {/* Retired screens: old links keep working */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/scrapbook/:date" element={Protected(<OldScrapbookRedirect />)} />
          <Route path="/notes" element={<Navigate to="/letters" replace />} />
          <Route path="/notes/new" element={<Navigate to="/letters" replace />} />
          <Route path="/notes/:id" element={<OldLetterRedirect />} />
          <Route path="/memory/new" element={<Navigate to="/home" replace />} />
          <Route path="/upload/memory" element={<Navigate to="/home" replace />} />
          <Route path="/camera" element={<Navigate to="/home" replace />} />
          <Route path="/gallery" element={<Navigate to="/timeline" replace />} />
          <Route path="/gallery/:date" element={<Navigate to="/timeline" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
