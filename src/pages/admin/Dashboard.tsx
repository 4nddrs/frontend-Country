import { useState } from "react";

const Dashboard = () => {
  const [transactions] = useState([
    { id: "TX001", user: "John Doe", date: "2025-08-17", amount: 250 },
    { id: "TX002", user: "Jane Smith", date: "2025-08-16", amount: 180 },
    { id: "TX003", user: "Alice Brown", date: "2025-08-15", amount: 420 },
  ]);

  return (
    <div  className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome to your dashboard</p>
        </div>
        <button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">
          Download Reports
        </button>
      </header>


      <div className="flex flex-col lg:flex-row gap-4">


        <div className="flex-1 space-y-4">
          
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition">
              <h2 className="text-xl font-bold">Emails Sent</h2>
              <p className="text-2xl mt-2">12,361</p>
              <p className="text-green-400 mt-1">+14%</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition">
              <h2 className="text-xl font-bold">Sales Obtained</h2>
              <p className="text-2xl mt-2">431,225</p>
              <p className="text-green-400 mt-1">+21%</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition">
              <h2 className="text-xl font-bold">New Clients</h2>
              <p className="text-2xl mt-2">32,441</p>
              <p className="text-green-400 mt-1">+5%</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition">
              <h2 className="text-xl font-bold">Traffic Received</h2>
              <p className="text-2xl mt-2">1,325,134</p>
              <p className="text-green-400 mt-1">+43%</p>
            </div>
          </div>

          {/* REVENUE + CHART */}
          <div className="bg-gray-800 p-4 rounded-xl shadow">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Revenue Generated</h2>
                <p className="text-2xl font-bold text-green-400">$59,342.32</p>
              </div>
              <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded font-semibold">
                Download
              </button>
            </div>
            <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300">
              Line Chart Placeholder
            </div>
          </div>

          {/* Lower Grid: Campaign, Sales, Geography */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Campaign */}
            <div className="bg-gray-800 p-4 rounded-xl shadow flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-2">Campaign</h2>
              <div className="h-32 w-32 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                Progress
              </div>
              <p className="text-green-400 font-semibold">$48,352 revenue generated</p>
              <p className="text-gray-400 text-center text-sm mt-1">
                Includes extra misc expenditures and costs
              </p>
            </div>

            {/* Sales Quantity */}
            <div className="bg-gray-800 p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-2">Sales Quantity</h2>
              <div className="h-48 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300">
                Bar Chart Placeholder
              </div>
            </div>

            {/* Geography */}
            <div className="bg-gray-800 p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-2">Geography Based Traffic</h2>
              <div className="h-48 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300">
                Map Placeholder
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Transactions (tamaño fijo, no crece) */}
        <div className="bg-gray-800 p-4 rounded-xl shadow overflow-auto max-h-96">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center border-b border-gray-700 py-2"
            >
              <div>
                <p className="text-green-400 font-semibold">{tx.id}</p>
                <p className="text-gray-300">{tx.user}</p>
              </div>
              <p className="text-gray-300">{tx.date}</p>
              <p className="bg-green-600 px-2 py-1 rounded">${tx.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;