export function QuickStartSection() {
  return (
    <div className="mt-16" data-testid="quick-start-section">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">Quick Start Guide</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start space-x-4" data-testid="step-install">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Install Dependencies</h4>
                <p className="text-slate-600 mt-1">Run npm install to set up all required packages</p>
                <code className="mt-2 block bg-slate-100 text-slate-800 px-3 py-2 rounded font-mono text-sm">npm install</code>
              </div>
            </div>

            <div className="flex items-start space-x-4" data-testid="step-develop">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Start Development</h4>
                <p className="text-slate-600 mt-1">Launch the development server with hot reload</p>
                <code className="mt-2 block bg-slate-100 text-slate-800 px-3 py-2 rounded font-mono text-sm">npm run dev</code>
              </div>
            </div>

            <div className="flex items-start space-x-4" data-testid="step-build">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Build & Deploy</h4>
                <p className="text-slate-600 mt-1">Create production build when ready</p>
                <code className="mt-2 block bg-slate-100 text-slate-800 px-3 py-2 rounded font-mono text-sm">npm run build</code>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl" data-testid="dev-tools-status">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Development Tools</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Hot Reload</span>
                <span className="text-green-600 text-sm font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Error Boundaries</span>
                <span className="text-green-600 text-sm font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">CORS Configuration</span>
                <span className="text-green-600 text-sm font-medium">Configured</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Logging</span>
                <span className="text-green-600 text-sm font-medium">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
