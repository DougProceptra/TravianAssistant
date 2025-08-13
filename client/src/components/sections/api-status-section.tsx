import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ApiResponse {
  message: string;
  timestamp: string;
  status: string;
  version: string;
}

export function ApiStatusSection() {
  const { toast } = useToast();
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);

  const { data: healthData, isLoading: healthLoading } = useQuery<ApiResponse>({
    queryKey: ["/api/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: helloData, isLoading: helloLoading, refetch: refetchHello } = useQuery<ApiResponse>({
    queryKey: ["/api/hello"],
    enabled: false, // Only fetch when manually triggered
  });

  const handleTestApi = async () => {
    try {
      await refetchHello();
      setLastTestTime(new Date().toLocaleTimeString());
      toast({
        title: "API Test Successful",
        description: "The /api/hello endpoint responded successfully.",
      });
    } catch (error) {
      toast({
        title: "API Test Failed",
        description: "Failed to connect to the API endpoint.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshApi = async () => {
    await refetchHello();
    setLastTestTime(new Date().toLocaleTimeString());
  };

  const serverStatus = healthLoading ? "Checking..." : healthData ? "Online" : "Offline";
  const statusColor = healthData ? "text-green-600" : "text-red-600";
  const statusBgColor = healthData ? "bg-green-100" : "bg-red-100";

  return (
    <div className="mt-16 bg-slate-50 rounded-xl p-8" data-testid="api-status-section">
      <div className="max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">API Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="server-status-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900">Server Status</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBgColor} ${statusColor}`}>
                <Circle className="w-2 h-2 mr-1 fill-current" />
                {serverStatus}
              </span>
            </div>
            <p className="text-slate-600 text-sm">Express.js server running on port 5000</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200" data-testid="api-endpoint-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900">API Endpoint</h4>
              <Button 
                variant="link" 
                size="sm"
                onClick={handleTestApi}
                disabled={helloLoading}
                data-testid="button-test-api"
              >
                {helloLoading ? "Testing..." : "Test API"}
              </Button>
            </div>
            <code className="text-slate-600 text-sm bg-slate-100 px-2 py-1 rounded font-mono">/api/hello</code>
          </div>
        </div>

        {/* API Response Display */}
        {helloData && (
          <div className="mt-6 bg-white p-6 rounded-lg border border-slate-200" data-testid="api-response-display">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Latest API Response</h4>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre data-testid="api-response-content">{JSON.stringify(helloData, null, 2)}</pre>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500" data-testid="last-updated-time">
                Last updated: {lastTestTime || "Never"}
              </span>
              <Button 
                variant="link" 
                size="sm"
                onClick={handleRefreshApi}
                disabled={helloLoading}
                data-testid="button-refresh-api"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${helloLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
