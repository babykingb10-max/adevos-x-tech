import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Heading from "../ui/Heading";
import api from "../../api/client";

const GROUP_LABELS = { services: "Services", company: "Company", legal: "Legal", resources: "Resources" };

export default function Footer() {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    api.get("/footer-links").then((res) => setLinks(res.data)).catch(() => {});
  }, []);

  const byGroup = Object.keys(GROUP_LABELS).map((group) => ({
    group,
    items: links.filter((l) => l.group === group),
  }));

  return (
    <footer className="bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {byGroup.map(({ group, items }) => (
          <div key={group}>
            <Heading as="h4" className="text-sm uppercase mb-4">{GROUP_LABELS[group]}</Heading>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item._id}>
                  <Link to={item.url} className="text-sm text-muted dark:text-muted-dark font-body hover:text-brand dark:hover:text-brand-dark">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border dark:border-border-dark text-center py-4 text-xs text-muted dark:text-muted-dark font-body">
        © {new Date().getFullYear()} Adevos-X Tech. All rights reserved.
      </div>
    </footer>
  );
}
