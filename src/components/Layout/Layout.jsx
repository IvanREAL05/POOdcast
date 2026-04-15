import { Disc, Home, Mic2, Box } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      
      {/* Sidebar (Menú Lateral) */}
      <aside className="w-64 bg-slate-950 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 flex items-center gap-2 text-blue-500">
          <Disc size={32} className="animate-spin-slow" /> 
          <span className="text-xl font-bold tracking-tighter uppercase italic">POOdcast</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            to="/" 
            icon={<Home size={20} />} 
            text="Inicio" 
          />
          <SidebarItem 
            to="/" 
            icon={<Mic2 size={20} />} 
            text="POOdcast" 
          />
          <SidebarItem 
            to="/experience" 
            icon={<Box size={20} />} 
            text="Experiencia 3D" 
          />
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
          <p>PROYECTO FINAL MULTIMEDIA</p>
          <p>ING. EN COMPUTACIÓN</p>
          <p className="mt-2 text-blue-500/50">v1.0.5</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth bg-gradient-to-b from-slate-900 to-black">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// Componente auxiliar usando NavLink para gestión automática de estados
const SidebarItem = ({ icon, text, to }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => `
      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
      ${isActive 
        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-500/5' 
        : 'hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent'
      }
    `}
  >
    {icon}
    <span className="font-bold text-sm tracking-wide">{text}</span>
  </NavLink>
);

export default Layout;