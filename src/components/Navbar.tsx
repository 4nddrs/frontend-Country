const Navbar: React.FC = () => {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Control de Caballos</h1>
      <button className="bg-blue-500 text-white px-3 py-1 rounded">Salir</button>
    </header>
  );
};

export default Navbar;
