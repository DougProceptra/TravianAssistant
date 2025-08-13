import { Link } from "wouter";
import { Home, Layers, FileText, Terminal, Activity } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-shrink-0 w-64 bg-slate-50 border-r border-slate-200">
      <div className="flex flex-col w-full">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Getting Started
            </div>
            <Link href="/" className="bg-slate-100 text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md" data-testid="sidebar-dashboard">
              <Home className="text-slate-500 mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <a href="#" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md" data-testid="sidebar-components">
              <Layers className="text-slate-400 group-hover:text-slate-500 mr-3 h-5 w-5" />
              Components
            </a>
            <a href="#" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md" data-testid="sidebar-api-reference">
              <FileText className="text-slate-400 group-hover:text-slate-500 mr-3 h-5 w-5" />
              API Reference
            </a>

            <div className="px-3 py-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Development
            </div>
            <a href="#" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md" data-testid="sidebar-console">
              <Terminal className="text-slate-400 group-hover:text-slate-500 mr-3 h-5 w-5" />
              Console
            </a>
            <a href="#" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md" data-testid="sidebar-logs">
              <Activity className="text-slate-400 group-hover:text-slate-500 mr-3 h-5 w-5" />
              Logs
            </a>
          </nav>
        </div>
      </div>
    </aside>
  );
}
