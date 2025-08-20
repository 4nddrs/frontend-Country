export default function Header() {
  return (
    <header className="flex items-center justify-between bg-white shadow px-4 py-3 sticky top-0">
      <h1 className="text-xl font-semibold">Panel de Control</h1>
      <input
        type="text"
        placeholder="Buscar..."
        className="border rounded px-3 py-1"
      />
    </header>
  );
}
