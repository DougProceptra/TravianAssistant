import { FileText } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">Blank App</span>
            </div>
            <p className="text-slate-600 max-w-md">
              A clean, minimal starting point for your next web application. Built with modern tools and best practices.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-docs">Documentation</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-api">API Reference</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-examples">Examples</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-github">GitHub</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-help">Help Center</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-community">Community</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-contact">Contact</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="footer-status">Status</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200">
          <p className="text-center text-slate-500 text-sm">
            © 2024 Blank App. Built with React, Express.js, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
}
