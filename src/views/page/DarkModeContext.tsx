import React from "react";

export const DarkModeContext = React.createContext<{ darkMode: boolean, setDarkMode: Function | undefined }>({ darkMode: false, setDarkMode: undefined});