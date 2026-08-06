import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import Heading from "../ui/Heading";
import { getIcon } from "../../lib/icons";
import { useAuth } from "../../context/AuthContext";
import { usePopup } from "../../context/PopupContext";
import { resolveSmartDeploy } from "../../lib/smartDeploy";

/* ---------------- Our Services ---------------- */
export function ServicesSection() {
  const [services, setServices] = useState([]);
  useEffect(() => { api.get("/services").then((r) => setServices(r.data)).catch(() => {}); }, []);

  return (
    <section className="py-12 px-4">
      <Heading as="h2" className="text-center text-2xl">Our Services</Heading>
      <p className="text-center text-muted dark:text-muted-dark font-body mb-8">What we offer</p>
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto scroll-row snap-x">
        {services.map((s) => {
          const Icon = getIcon(s.icon);
          return (
            <div key={s._id} className="card min-w-[260px] snap-center p-6 flex flex-col items-center text-center">
              <Icon className="text-brand dark:text-brand-dark mb-3" size={32} />
              <Heading as="h3" className="text-base mb-2">{s.heading}</Heading>
              <p className="text-sm text-muted dark:text-muted-dark font-body">{s.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Get in touch ---------------- */
export function InTouchSection() {
  const [cards, setCards] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open: openPopup } = usePopup();
  useEffect(() => { api.get("/in-touch").then((r) => setCards(r.data)).catch(() => {}); }, []);

  function handleClick(c) {
    if (c.actionTarget === "smart:deploy") {
      resolveSmartDeploy({ user, navigate, openPopup });
    } else {
      openPopup(c.actionTarget);
    }
  }

  return (
    <section className="py-12 px-4">
      <Heading as="h2" className="text-center text-2xl mb-8">Get in touch</Heading>
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto scroll-row snap-x">
        {cards.map((c) => (
          <div key={c._id} className="card min-w-[240px] snap-center p-6 flex flex-col items-center text-center">
            <Heading as="h3" className="text-base mb-2">{c.heading}</Heading>
            <p className="text-sm text-muted dark:text-muted-dark font-body mb-4">{c.description}</p>
            {c.actionType === "internal_link" ? (
              <Link to={c.actionTarget} className="btn-primary text-xs">{c.buttonLabel}</Link>
            ) : (
              <button onClick={() => handleClick(c)} className="btn-primary text-xs">{c.buttonLabel}</button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Support ---------------- */
export function SupportSection() {
  const [support, setSupport] = useState(null);
  useEffect(() => { api.get("/support").then((r) => setSupport(r.data)).catch(() => {}); }, []);
  if (!support?.description) return null;

  return (
    <section id="support" className="py-12 px-4">
      <Heading as="h2" className="text-center text-2xl mb-8">Support</Heading>
      <div className="card p-8 max-w-2xl mx-auto text-center">
        <p className="text-muted dark:text-muted-dark font-body mb-6">{support.description}</p>
        <div className="flex justify-center gap-6">
          <a href={support.communityUrl} target="_blank" rel="noreferrer" className="text-brand dark:text-brand-dark">
            {(() => { const Icon = getIcon(support.communityIcon || "community"); return <Icon size={28} />; })()}
          </a>
          <a href={support.whatsappUrl} target="_blank" rel="noreferrer" className="text-brand dark:text-brand-dark">
            {(() => { const Icon = getIcon(support.whatsappIcon || "whatsapp"); return <Icon size={28} />; })()}
          </a>
          <a href={support.telegramUrl} target="_blank" rel="noreferrer" className="text-brand dark:text-brand-dark">
            {(() => { const Icon = getIcon(support.telegramIcon || "telegram"); return <Icon size={28} />; })()}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Client feedback ---------------- */
export function TestimonialsSection() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/testimonials").then((r) => setItems(r.data)).catch(() => {}); }, []);
  if (!items.length) return null;

  return (
    <section className="py-12 px-4">
      <Heading as="h2" className="text-center text-2xl mb-8">Client feedback</Heading>
      <div className="flex gap-4 overflow-x-auto scroll-row snap-x px-1">
        {items.map((t) => (
          <div key={t._id} className="card min-w-[260px] snap-center p-6">
            <p className="text-sm text-text dark:text-text-dark font-body mb-4">"{t.message}"</p>
            <p className="text-sm font-semibold text-brand dark:text-brand-dark font-display">{t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Stay Connected ---------------- */
export function StayConnectedSection() {
  const [links, setLinks] = useState([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "sent" | "error"
  useEffect(() => { api.get("/stay-connected").then((r) => setLinks(r.data)).catch(() => {}); }, []);

  async function handleSubscribe(e) {
    e.preventDefault();
    try {
      await api.post("/newsletter", { email });
      setStatus("sent");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-12 px-4">
      <div className="card bg-brand/5 dark:bg-brand-dark/5 p-8 text-center max-w-2xl mx-auto">
        <Heading as="h2" className="text-2xl mb-1">Stay Connected</Heading>
        <p className="text-muted dark:text-muted-dark font-body mb-6">Follow us and subscribe</p>
        <div className="flex justify-center flex-wrap gap-4 mb-6">
          {links.map((l) => {
            const Icon = getIcon(l.icon);
            return (
              <a key={l._id} href={l.url} target="_blank" rel="noreferrer"
                 className="w-10 h-10 rounded-full bg-brand/10 dark:bg-brand-dark/10 flex items-center justify-center text-brand dark:text-brand-dark">
                <Icon size={18} />
              </a>
            );
          })}
        </div>
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
        >
          <input
            value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
            placeholder="Your email"
            className="flex-1 rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none"
          />
          <button type="submit" className="btn-primary">Subscribe</button>
        </form>
        {status === "sent" && <p className="text-xs text-brand dark:text-brand-dark font-body mt-2">Subscribed! Thanks for joining.</p>}
        {status === "error" && <p className="text-xs text-red-500 font-body mt-2">Something went wrong — try again.</p>}
      </div>
    </section>
  );
}
