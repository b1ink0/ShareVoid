import React, { useContext, useState } from "react";

// Creating Context
const StateContext = React.createContext();

// Using Created Context a 
export function useStateContext() {
  return useContext(StateContext);
}

// Creating Provider
export function StateProvider({ children }) {
    const [loggedIn, setLoggedIn] = useState(false);

    const values = {
        loggedIn,
        setLoggedIn
    }
    return (
    <StateContext.Provider value={values}>   
        {children}
    </StateContext.Provider>
    );
}