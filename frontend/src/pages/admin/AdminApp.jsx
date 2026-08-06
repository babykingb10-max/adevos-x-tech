import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminLogin from "./AdminLogin";
import AdminCrudSection from "../../components/admin/AdminCrudSection";
import AdminUsers from "./AdminUsers";
import AdminPayments from "./AdminPayments";
import AdminDeployment from "./AdminDeployment";
import AdminAV from "./AdminAV";
import AdminResponses from "./AdminResponses";
import AdminSupport from "./AdminSupport";
import AdminMenuBuilder from "./AdminMenuBuilder";
import AdminBots from "./AdminBots";
import AdminDashboard from "./AdminDashboard";

const NAV = [
  { path: "", label: "Dashboard" },
  { path: "hero-slider", label: "Hero Slider" },
  { path: "services", label: "Services" },
  { path: "in-touch", label: "InTouch" },
  { path: "support", label: "Support" },
  { path: "feedback", label: "Client Feedback" },
  { path: "stay-connected", label: "StayConnected" },
  { path: "footer", label: "Footer" },
  { path: "menu", label: "Menu" },
  { path: "plans", label: "Plans" },
  { path: "bots", label: "Bots" },
  { path: "payment", label: "Payment" },
  { path: "deployment", label: "Deployment" },
  { path: "av", label: "AV" },
  { path: "updates", label: "Updates" },
  { path: "users", label: "Users" },
  { path: "responses", label: "Responses" },
];

export default function AdminApp() {
  const { user, loading, refetch } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="min-h-screen bg-bg-dark" />;
  if (!user || user.role !== "admin") return <AdminLogin onSuccess={refetch} />;

  const current = location.pathname.split("/admin/")[1] || "";

  const SidebarNav = (
    <>
      <Link to="/" className="text-xs text-muted-dark font-body mb-6 block">← Go to website</Link>
      <h1 className="heading text-lg mb-6">Admin</h1>
      <nav className="space-y-1">
        {NAV.map((n) => (
          <Link key={n.path} to={`/admin/${n.path}`} onClick={() => setSidebarOpen(false)}
            className={`block text-sm font-body px-3 py-2 rounded-lg ${current === n.path ? "bg-brand-dark/10 text-brand-dark" : "text-muted-dark hover:text-text-dark"}`}>
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex bg-bg-dark text-text-dark">
      {/* Desktop sidebar */}
      <aside className="w-56 border-r border-border-dark p-4 hidden md:block overflow-y-auto shrink-0">
        {SidebarNav}
      </aside>

      {/* Mobile top bar + slide-over sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-bg-dark border-b border-border-dark flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="text-brand-dark"><Menu size={22} /></button>
        <span className="heading text-base">Admin</span>
        <span className="w-6" />
      </div>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-bg-dark border-r border-border-dark p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setSidebarOpen(false)} className="text-brand-dark"><X size={20} /></button>
            </div>
            {SidebarNav}
          </aside>
        </div>
      )}

        </nav>
      </aside>

      <main className="flex-1 p-6 pt-20 md:pt-6 overflow-y-auto overflow-x-hidden min-w-0">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="hero-slider" element={
            <AdminCrudSection title="Hero Slider" endpoint="/hero-slides"
              fields={[{ key: "heading", label: "Heading" }, { key: "description", label: "Description", type: "textarea" },
                       { key: "imageUrl", label: "Image URL" }, { key: "buttonLabel", label: "Button label" },
                       { key: "actionTarget", label: "Action destination", type: "destination", actionTypeKey: "actionType" }]} />
          } />
          <Route path="services" element={
            <AdminCrudSection title="Services" endpoint="/services"
              fields={[{ key: "heading", label: "Heading" }, { key: "icon", label: "Icon", type: "icon" }, { key: "description", label: "Description", type: "textarea" }]} />
          } />
          <Route path="in-touch" element={
            <AdminCrudSection title="Get in touch" endpoint="/in-touch"
              fields={[{ key: "heading", label: "Heading" }, { key: "description", label: "Description", type: "textarea" },
                       { key: "buttonLabel", label: "Button label" }, { key: "actionTarget", label: "Action target", type: "destination" }]} />
          } />
          <Route path="support" element={<AdminSupport />} />
          <Route path="feedback" element={
            <AdminCrudSection title="Client Feedback" endpoint="/testimonials"
              fields={[{ key: "name", label: "Name" }, { key: "message", label: "Feedback message", type: "textarea" }, { key: "avatarUrl", label: "Avatar URL" }]} />
          } />
          <Route path="stay-connected" element={
            <AdminCrudSection title="Stay Connected" endpoint="/stay-connected"
              fields={[{ key: "platform", label: "Platform key" }, { key: "icon", label: "Icon", type: "icon" }, { key: "url", label: "URL" }]} />
          } />
          <Route path="footer" element={
            <AdminCrudSection title="Footer links" endpoint="/footer-links"
              fields={[{ key: "group", label: "Group", type: "select", options: [
                        { value: "services", label: "Services" }, { value: "company", label: "Company" },
                        { value: "legal", label: "Legal" }, { value: "resources", label: "Resources" }] },
                       { key: "label", label: "Label" }, { key: "url", label: "URL / destination", type: "destination" }]} />
          } />
          <Route path="menu" element={<AdminMenuBuilder />} />
          <Route path="plans" element={
            <AdminCrudSection title="Plans" endpoint="/plans"
              fields={[{ key: "key", label: "Key", type: "select", options: [{ value: "user", label: "User" }, { value: "deployer", label: "Deployer" }] },
                       { key: "heading", label: "Heading" }, { key: "description", label: "Description", type: "textarea" }]} />
          } />
          <Route path="bots" element={<AdminBots />} />
          <Route path="payment/*" element={<AdminPayments />} />
          <Route path="deployment/*" element={<AdminDeployment />} />
          <Route path="av" element={<AdminAV />} />
          <Route path="updates" element={
            <AdminCrudSection title="Updates" endpoint="/updates"
              fields={[{ key: "heading", label: "Heading" }, { key: "description", label: "Description", type: "textarea" }]} />
          } />
          <Route path="users" element={<AdminUsers />} />
          <Route path="responses" element={<AdminResponses />} />
        </Routes>
      </main>
    </div>
  );
}
