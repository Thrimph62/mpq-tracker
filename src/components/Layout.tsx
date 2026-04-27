import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, Zap, Shield, Swords, Scroll, Puzzle, LogOut, Upload
} from 'lucide-react'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Tableau de Bord' },
  { to: '/characters', icon: Users,           label: 'Personnages'     },
  { to: '/powers',     icon: Zap,             label: 'Pouvoirs'        },
  { to: '/supports',   icon: Shield,          label: 'Supports'        },
  { to: '/teams',      icon: Swords,          label: 'Équipes'         },
  { to: '/quetes',     icon: Scroll,          label: 'Quêtes'          },
  { to: '/gauntlet',   icon: Puzzle,          label: 'Puzzle Gauntlet' },
  { to: '/import',     icon: Upload,          label: 'Import Excel'    },
]

export default function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-[#363660] border-r border-[#6A6A95] flex flex-col">
        <div className="p-5 border-b border-[#6A6A95]">
          <h1 className="font-marvel text-2xl tracking-widest text-marvel-gold">MPQ</h1>
          <p className="text-xs text-[#8888AA] mt-0.5">Tracker</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-marvel-red text-white font-semibold' : 'text-[#8888AA] hover:bg-[#424270] hover:text-white'
                }`}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[#6A6A95]">
          <button onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8888AA] hover:bg-[#424270] hover:text-white transition-all w-full">
            <LogOut size={16} />Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto"><Outlet /></div>
      </main>
    </div>
  )
}
