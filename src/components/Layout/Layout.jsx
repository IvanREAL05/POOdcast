import { Disc, Home, Mic2, Box } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      
      {/* Sidebar (Menú Lateral) */}
      <aside className="w-64 bg-slate-950 flex flex-col border-r border-slate-800">
        <div className="p-6 flex items-center gap-2 text-blue-500">
          <Disc size={32} className="animate-spin-slow" /> 
          <span className="text-xl font-bold tracking-tighter">StreamHub</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem icon={<Home size={20} />} text="Inicio" active />
          <SidebarItem icon={<Mic2 size={20} />} text="POOdcast" />
          <SidebarItem icon={<Box size={20} />} text="Experiencia 3D" />
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>Proyecto Final Multimedia</p>
          <p>Ing. Computación</p>
        </div>
      </aside>

      {/* Main Content (Donde irá el reproductor y la lista) */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// Componente auxiliar pequeño para los items del menú
const SidebarItem = ({ icon, text, active }) => (
  <button 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
        : 'hover:bg-slate-800 text-slate-400 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{text}</span>
  </button>
);

export default Layout;