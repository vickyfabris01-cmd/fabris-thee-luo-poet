import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import OfflineBanner from "../components/OfflineBanner";
import AppRoutes from "./routes";
import { ToastProvider } from "../context/ToastProvider";
import { useLocation } from "react-router-dom";

export default function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  return (
    <ToastProvider>
      <OfflineBanner />
      <Header />
      <main>
        <AppRoutes />
      </main>
      {isHomePage && <Footer />}
    </ToastProvider>
  );
}
