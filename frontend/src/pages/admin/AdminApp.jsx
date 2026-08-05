import { Routes, Route, Link, useLocation } from "react-router-dom";
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

  if (loading) return <div className="min-h-screen bg-bg-dark" />;
  if (!user || user.role !== "admin") return <AdminLogin onSuccess={refetch} />;

  const current = location.pathname.split("/admin/")[1] || "";

  return (
    <div className="min-h-screen flex bg-bg-dark text-text-dark">
      <aside className="w-56 border-r border-border-dark p-4 hidden md:block overflow-y-auto">
        <Link to="/" className="text-xs text-muted-dark font-body mb-6 block">← Go to website</Link>
        <h1 className="heading text-lg mb-6">Admin</h1>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link key={n.path} to={`/admin/${n.path}`}
              className={`block text-sm font-body px-3 py-2 rounded-lg ${current === n.path ? "bg-brand-dark/10 text-brand-dark" : "text-muted-dark hover:text-text-dark"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="hero-slider" element={
            <AdminCrudSection title="Hero Slider" endpoint="/hero-slides"
              fields={[{ key: "heading", label: "Heading" }, { key: "description", label: "Description" },
                       { key: "imageUrl", label: "Image URL" }, { key: "buttonLabel", label: "Button label" },
                       { key: "actionTarget", label: "Action destination (route, popup:key, or URL)" }]} />
          } />
          <Route path="services" element={
            <AdminCrudSection title="Services" endpoint="/services"
              fields={[{ key: "heading", label: "Heading" }, { key: "icon", label: "Icon key" }, { key: "description", label: "Description" }]} />
          } />
          <Route path="in-touch" element={
            <AdminCrudSection title="Get in touch" endpoint="/in-touch"
              fields={[{ key: "heading", label: "Heading" }, { key: "description", label: "Description" },
                       { key: "buttonLabel", label: "Button label" }, { key: "actionTarget", label: "Action target" }]} />
          } />
          <Route path="support" element={<AdminSupport />} />
          <Route path="feedback" element={
            <AdminCrudSection title="Client Feedback" endpoint="/testimonials"
              fields={[{ key: "name", label: "Name" }, { key: "message", label: "Feedback message" }, { key: "avatarUrl", label: "Avatar URL" }]} />
          } />
          <Route path="stay-connected" element={
            <AdminCrudSection title="Stay Connected" endpoint="/stay-connected"
              fields={[{ key: "platform", label: "Platform key" }, { key: "icon", label: "Icon key" }, { key: "url", label: "URL" }]} />
          } />
          <Route path="footer" element={
            <AdminCrudSection title="Footer links" endpoint="/footer-links"
              fields={[{ key: "group", label: "Group (services/company/legal/resources)" }, { key: "label", label: "Label" }, { key: "url", label: "URL" }]} />
          } />
          <Route path="menu" element={<AdminMenuBuilder />} />
          <Route path="plans" element={
            <AdminCrudSection title="Plans" endpoint="/plans"
              fields={[{ key: "key", label: "Key (user/deployer)" }, { key: "heading", label: "Heading" }, { key: "description", label: "Description" }]} />
          } />
          <Route path="bots" element={
            <AdminCrudSection title="Bots" endpoint="/bots"
              fields={[{ key: "name", label: "Name" }, { key: "slug", label: "Slug" }, { key: "description", label: "Description" },
                       { key: "author", label: "Author" }, { key: "imageUrl", label: "Image URL" }, { key: "githubRepoUrl", label: "GitHub repo URL" },
                       { key: "pairSiteUrl", label: "Pair site URL" }]} />
          } />
          <Route path="payment/*" element={<AdminPayments />} />
          <Route path="deployment/*" element={<AdminDeployment />} />
          <Route path="av" element={<AdminAV />} />
          <Route path="updates" element={
            <AdminCrudSection title="Updates" endpoint="/updates"
              fields={[{ key: "heading", label: "Heading" }, { key: "description", label: "Description" }]} />
          } />
          <Route path="users" element={<AdminUsers />} />
          <Route path="responses" element={<AdminResponses />} />
        </Routes>
      </main>
    </div>
  );
}
