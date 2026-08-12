"use client";

import Link from "next/link";

const menuItems = [
  { name: "Dashboard", href: "/" },
  { name: "Properties", href: "/properties" },
  { name: "Work Orders", href: "/work-orders" },
  { name: "Assets", href: "/assets" },
  { name: "Vendors", href: "/vendors" },
  { name: "Inspections", href: "/inspections" },
  { name: "Documents", href: "/documents" },
  { name: "Reports", href: "/reports" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="border-b border-gray-800 p-6">
        <h1 className="text-2xl font-bold">PropertyCare Pal</h1>
        <p className="mt-1 text-sm text-gray-400">
          Property Management Platform
        </p>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="block rounded-lg px-4 py-3 transition hover:bg-gray-800"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}