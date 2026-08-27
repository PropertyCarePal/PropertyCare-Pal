"use client";
import { useRouter } from "next/navigation";
export default function Sidebar() {
  const router = useRouter();
  const navigation = [
    "Dashboard",
    "Properties",
    "Assets",
    "Work Orders",
    "Service Catalog",
    "Vendors",
    "Reports",
    "Settings",
  ];

  return (
    <aside className="w-64 min-h-screen bg-white border-r p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">PropertyCare Pal</h1>

        <p className="text-sm text-gray-500 mt-1">
          Connecting Properties,
          <br />
          People & Services
        </p>
      </div>

      <nav className="space-y-2">
      {navigation.map((item) => (
  <div
    key={item}
    onClick={() => {
      if (item === "Dashboard") {
        router.push("/");
      }
    }}
    className="px-4 py-3 rounded-lg hover:bg-gray-100 cursor-pointer"
  >
    {item}
  </div>
))}
      </nav>
    </aside>
  );
}
