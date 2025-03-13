import { useLocation } from "react-router-dom";// Importez le AuthProvider
import Layout from "./layouts/Layout";
import AppRoutes from "./router/AppRoutes";
import { Blank } from "./layouts/Blank";
import { AuthProvider } from "./context/authContext";

function App() {
  const location = useLocation();
  const isAuthPath = location.pathname.includes("auth") ||
    location.pathname.includes("error") ||
    location.pathname.includes("under-maintenance") ||
    location.pathname.includes("blank");

  return (
     <AuthProvider>{/* Ajoutez le AuthProvider ici */}
      {isAuthPath ? (
        <Blank>
          <AppRoutes />
        </Blank>
      ) : (
        <Layout>
          <AppRoutes />
        </Layout>
      )}
      </AuthProvider> 
      
  );
}

export default App;