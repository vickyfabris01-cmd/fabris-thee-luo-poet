import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import OfflineBanner from "../components/OfflineBanner";
import AppRoutes from "./routes";
import { ToastProvider } from "../context/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <OfflineBanner />
      <Header />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </ToastProvider>
  );
}
