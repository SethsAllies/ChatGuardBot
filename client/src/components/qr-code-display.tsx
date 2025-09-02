import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BotStatus {
  status: string;
  qrCode?: string;
  session?: {
    phoneNumber?: string;
    connectedAt?: string;
    sessionId: string;
  };
}

export default function QRCodeDisplay() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: botStatus, isLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const startBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({ title: "Bot started successfully" });
    },
    onError: () => {
      toast({ title: "Failed to start bot", variant: "destructive" });
    },
  });

  const disconnectBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({ title: "Bot disconnected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to disconnect bot", variant: "destructive" });
    },
  });

  const saveSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/save-session"),
    onSuccess: () => {
      toast({ title: "Session saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save session", variant: "destructive" });
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* QR Code Section */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">WhatsApp Connection</h3>
          <p className="text-sm text-muted-foreground">Scan QR code to connect your WhatsApp account</p>
        </div>
        <div className="p-6">
          <div className="bg-muted rounded-lg p-8 text-center">
            <div className="w-48 h-48 bg-background rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-border">
              {botStatus?.qrCode ? (
                <img 
                  src={botStatus.qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-full h-full object-contain"
                  data-testid="qr-code-image"
                />
              ) : (
                <div className="text-center">
                  <i className="fas fa-qrcode text-4xl text-muted-foreground mb-2"></i>
                  <p className="text-sm text-muted-foreground">
                    {botStatus?.status === 'connected' ? 'Already connected' : 'QR Code will appear here'}
                  </p>
                </div>
              )}
            </div>
            {botStatus?.status !== 'connected' && (
              <Button 
                onClick={() => startBotMutation.mutate()}
                disabled={startBotMutation.isPending || botStatus?.status === 'connecting'}
                data-testid="button-generate-qr"
              >
                {botStatus?.status === 'connecting' ? 'Connecting...' : 'Generate QR Code'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Connection Details</h3>
        </div>
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${
                  botStatus?.status === 'connected' ? 'text-primary' : 
                  botStatus?.status === 'connecting' ? 'text-chart-3' : 
                  'text-muted-foreground'
                }`} data-testid="connection-status-detail">
                  {botStatus?.status === 'connected' ? 'Connected' :
                   botStatus?.status === 'connecting' ? 'Connecting...' :
                   botStatus?.status === 'error' ? 'Error' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span data-testid="connection-phone">{botStatus?.session?.phoneNumber || 'Not available'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connected Since:</span>
                <span data-testid="connection-time">
                  {botStatus?.session?.connectedAt ? 
                    new Date(botStatus.session.connectedAt).toLocaleString() : 
                    'Not connected'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono text-sm" data-testid="session-id">
                  {botStatus?.session?.sessionId || 'No session'}
                </span>
              </div>
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => disconnectBotMutation.mutate()}
                  disabled={disconnectBotMutation.isPending || botStatus?.status !== 'connected'}
                  data-testid="button-disconnect-whatsapp"
                >
                  Disconnect WhatsApp
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session Management */}
      <div className="lg:col-span-2 bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Session Management</h3>
          <p className="text-sm text-muted-foreground">Manage bot session and authentication</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => saveSessionMutation.mutate()}
              disabled={saveSessionMutation.isPending}
              data-testid="button-save-session"
            >
              <i className="fas fa-save mr-2"></i>
              Save Session
            </Button>
            <Button 
              variant="secondary"
              data-testid="button-load-session"
            >
              <i className="fas fa-upload mr-2"></i>
              Load Session
            </Button>
            <Button 
              variant="destructive"
              data-testid="button-clear-session"
            >
              <i className="fas fa-trash mr-2"></i>
              Clear Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
