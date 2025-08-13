import { Layers, CheckCircle, Monitor } from "lucide-react";

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid="feature-architecture">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <Layers className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Clean Architecture</h3>
        <p className="text-slate-600">Well-organized folder structure and component hierarchy for scalable development.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid="feature-practices">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Best Practices</h3>
        <p className="text-slate-600">Error boundaries, proper routing, and development tools configured out of the box.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid="feature-responsive">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <Monitor className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Responsive Design</h3>
        <p className="text-slate-600">Mobile-first design that looks great on all devices and screen sizes.</p>
      </div>
    </div>
  );
}
