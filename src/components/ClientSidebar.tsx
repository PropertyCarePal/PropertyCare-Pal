"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "My Property", href: "/client-portal", icon: "property" },
  { name: "Work Orders", href: "/client-portal/work-orders", icon: "work-orders" },
  { name: "Inspections", href: "/client-portal/inspections", icon: "inspections" },
  { name: "Assets", href: "/client-portal/assets", icon: "assets" },
  { name: "Documents", href: "/client-portal/documents", icon: "documents" },
  { name: "Maintenance", href: "/client-portal/maintenance", icon: "maintenance" },
  { name: "Settings", href: "/client-portal/settings", icon: "settings" },
];

function MenuIcon({
  name,
  active,
}: {
  name: string;
  active: boolean;
}) {
  const className = `h-5 w-5 shrink-0 ${
    active ? "text-blue-700" : "text-blue-100/60"
  }`;

  switch (name) {
    case "property":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );

    case "work-orders":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 9h8M8 13h6M8 17h4" />
        </svg>
      );

    case "inspections":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M9 4h6" />
          <path d="M8 3h8v3H8z" />
          <rect x="5" y="5" width="14" height="16" rx="2" />
          <path d="m8 13 2.5 2.5L16 10" />
        </svg>
      );

    case "assets":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21" />
        </svg>
      );

    case "documents":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v5h5" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      );

    case "maintenance":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M14 6a4 4 0 0 0-5 5L4 16a2 2 0 0 0 3 3l5-5a4 4 0 0 0 5-5l-2.5 2.5-3-3L14 6Z" />
          <path d="m14 14 5 5" />
        </svg>
      );

    case "settings":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.9 1.9-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22h-2.8v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.9-1.9.1-.1A1.7 1.7 0 0 0 7.7 15a1.7 1.7 0 0 0-1.6-1H6v-2.8h.1a1.7 1.7 0 0 0 1.6-1A1.7 1.7 0 0 0 7.4 8l-.1-.1 1.9-1.9.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5H15v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.9 1.9-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14H21a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );

    default:
      return null;
  }
}

export default function ClientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-[#102A43] text-white">
      <div className="relative overflow-hidden border-b border-white/10 px-4 py-6">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white via-white/70 to-[#102A43]" />

        <div className="relative flex items-center justify-center py-2">
          <img
            src="/brand/WaveLogo.png"
            alt="PropertyCare Pal"
            className="h-36 w-auto object-contain"
          />
        </div>

        <div className="relative mt-2 text-center">
          <h1 className="text-lg font-bold tracking-tight text-white">
            PropertyCare Pal
          </h1>

          <p className="mt-1 text-xs text-blue-100/70">
            Property Owner Portal
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/50">
          My Property
        </p>

        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/client-portal"
                ? pathname === "/client-portal"
                : pathname.startsWith(item.href);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#102A43] shadow-sm"
                      : "text-blue-50/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <MenuIcon name={item.icon} active={isActive} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-5 py-5">
        <div className="rounded-xl bg-white/5 px-4 py-3">
          <p className="text-xs font-medium text-blue-100/60">
            PropertyCare Pal
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            Your property. Simplified.
          </p>
        </div>
      </div>
    </aside>
  );
}