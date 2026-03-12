export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">Hub Manager Dashboard</h1>
        <p className="text-xl mb-8">Manage your hub operations and riders</p>
        <button className="px-8 py-3 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
