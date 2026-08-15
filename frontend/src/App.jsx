import { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PopupHost from "./components/popups/PopupHost";
import { BackButton, ScrollToTopButton } from "./components/ui/NavHelpers";
import LoadingScreen from "./components/ui/LoadingScreen";
import Home from "./pages/Home";
import AVCoins from "./pages/AVCoins";
import BotsAvailable from "./pages/BotsAvailable";
import BotManagement from "./pages/BotManagement";
import Deployment from "./pages/Deployment";
import Payment from "./pages/Payment";
import SignIn from "./pages/SignIn";
import AdminApp from "./pages/admin/AdminApp";

// Shows the branded loading screen briefly on every route change, giving the
// new page's data fetches time to resolve before the "empty then pop-in"
// flash the person was seeing.
function RouteTransitionLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return loading ? <LoadingScreen /> : null;
}

// A shared referral link (/r/:code) always sends the visitor straight to
// sign-up — it just forwards the code as a query param onto /sign-in, which
// forces signup-only mode when ?r= is present.
function ReferralRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();
  useEffect(() => { navigate(`/sign-in?r=${code}`, { replace: true }); }, [code, navigate]);
  return null;
}

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
            <RouteTransitionLoader />
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
                <Route path="/r/:code" element={<ReferralRedirect />} />
                {/* Any unmatched path (e.g. an old/removed route) lands on the
                    homepage instead of rendering blank content with just the
                    Navbar/Footer showing. */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <PopupHost />
            <BackButton />
            <ScrollToTopButton />
          </div>
        }
      />
    </Routes>
  );
}
