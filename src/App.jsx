import { AuthProvider } from "./context/AuthContext";
import { StateProvider } from "./context/StateContext";
import Main from "./components/Main";
import Home from "./components/Home";
import { DBConfig } from "./hooks/DBConfig";
import { initDB } from "react-indexed-db";

initDB(DBConfig);

function App() {
  return (
    <AuthProvider>
      <StateProvider>
        <Home />
      </StateProvider>
    </AuthProvider>
  );
}

export default App;
