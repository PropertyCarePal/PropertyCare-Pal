import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              PropertyCare Pal
            </h1>
            <p className="text-gray-600 mt-2">
              Property maintenance management made simple.
            </p>
          </header>

          {/* Dashboard Cards */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold">Properties</h2>
              <p className="text-4xl font-bold mt-4">24</p>
              <p className="text-gray-500">Active properties managed</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold">Service Requests</h2>
              <p className="text-4xl font-bold mt-4">8</p>
              <p className="text-gray-500">Pending maintenance items</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold">Assets</h2>
              <p className="text-4xl font-bold mt-4">156</p>
              <p className="text-gray-500">Tracked property assets</p>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-8 bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>

            <div className="flex flex-wrap gap-4">
              <button className="bg-black text-white px-5 py-3 rounded-lg">
                Add Property
              </button>

              <button className="bg-black text-white px-5 py-3 rounded-lg">
                Create Work Order
              </button>

              <button className="bg-black text-white px-5 py-3 rounded-lg">
                View Assets
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
