
import React, { useState } from "react";
import Login from "./login";
import DashboardMain from "./DashboardMain";

function App() {
  const [user, setUser] = useState(() => {
    const token =
      localStorage.getItem("smsToken") ||
      sessionStorage.getItem("smsToken");

    const savedUser =
      localStorage.getItem("smsUser") ||
      sessionStorage.getItem("smsUser");

    if (!token || !savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("smsToken");
      sessionStorage.removeItem("smsToken");
      return null;
    }
  });

  function handleLogout() {
    localStorage.removeItem("smsToken");
    localStorage.removeItem("smsUser");
    sessionStorage.removeItem("smsToken");
    sessionStorage.removeItem("smsUser");
    setUser(null);
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <DashboardMain onLogout={handleLogout} />;
}

export default App;
