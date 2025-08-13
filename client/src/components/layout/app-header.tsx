import { useState } from "react";
import { Link } from "wouter";
import { Menu, Moon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">Blank App</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="nav-home">
              Home
            </Link>
            <a href="#" className="text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="nav-docs">
              Documentation
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="nav-api">
              API
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="nav-settings">
              Settings
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700" data-testid="button-theme-toggle">
              <Moon className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <Link href="/" className="block text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="mobile-nav-home">
              Home
            </Link>
            <a href="#" className="block text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="mobile-nav-docs">
              Documentation
            </a>
            <a href="#" className="block text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="mobile-nav-api">
              API
            </a>
            <a href="#" className="block text-slate-600 hover:text-slate-900 font-medium transition-colors" data-testid="mobile-nav-settings">
              Settings
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
