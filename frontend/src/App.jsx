import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PopupHost from "./components/popups/PopupHost";
import Home from "./pages/Home";
import AVCoins from "./pages/AVCoins";
import BotsAvailable from "./pages/BotsAvailable";
import BotManagement from "./pages/BotManagement";
import Deployment from "./pages/Deployment";
import Payment from "./pages/Payment";
import SignIn from "./pages/SignIn";
import AdminApp from "./pages/admin/AdminApp";

export default function App() {
  return (
    <Routes>
      {/* Admin App is a fully separate shell — no public Navbar/Footer */}
      <Route path="/admin/*" element={<AdminApp />} />

      {/* Public + user-facing site */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/av-coins" element={<AVCoins />} />
                <Route path="/bots" element={<BotsAvailable />} />
                <Route path="/bot-management" element={<BotManagement />} />
                <Route path="/deployment" element={<Deployment />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/sign-in" element={<SignIn />} />
              </Routes>
            </main>
            <Footer />
            <PopupHost />
          </div>
        }
      />
    </Routes>
  );
}
