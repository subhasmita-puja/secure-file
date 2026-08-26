import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PublicShare from "./pages/PublicShare";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [showRegister, setShowRegister] = useState(false);

  const currentPath = window.location.pathname;

  const isPublicShare =
    currentPath.startsWith("/share/");

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setShowRegister(false);
  };

  /*
   * Public share links must work without authentication.
   */
  if (isPublicShare) {
    return <PublicShare />;
  }

  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (showRegister) {
    return (
      <Register
        onLogin={() => setShowRegister(false)}
      />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      onRegister={() => setShowRegister(true)}
    />
  );
}

export default App;