import React, { useContext, useEffect, useState } from "react";
import { auth, googleHandler, handleSignOut } from "../auth/firebase";

// Creating Context
const AuthContext = React.createContext();

// Using Created Context a
export function useAuth() {
  return useContext(AuthContext);
}

// Creating Provider
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);

  const logIn = () => {
    return googleHandler();
  };
  const logOut = () => {
    return handleSignOut();
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(false);
      } else setLoading(false);
    });
    return unsubscribe;
  });
  const value = {
    currentUser,
    logIn,
    logOut,
  };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}