import { useQuery } from "@tanstack/react-query";

interface BotStatus {
  status: string;
  qrCode?: string;
  session?: {
    phoneNumber?: string;
    connectedAt?: string;
    sessionId: string;
  };
}

export default function ConnectionStatus() {
  const { data: botStatus, isLoading, refetch } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'primary';
      case 'connecting': return 'chart-3';
      case 'disconnected': return 'muted-foreground';
      case 'error': return 'destructive';
      default: return 'muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full">
          <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const status = botStatus?.status || 'disconnected';
  const statusColor = getStatusColor(status);

  return (
    <div className="flex items-center space-x-4">
      <div className={`flex items-center space-x-2 px-3 py-1.5 bg-${statusColor}/10 text-${statusColor} rounded-full`} data-testid="connection-status">
        <div className={`w-2 h-2 bg-${statusColor} rounded-full ${status === 'connected' ? 'animate-pulse' : ''}`}></div>
        <span className="text-sm font-medium">{getStatusText(status)}</span>
      </div>
      <button 
        onClick={() => refetch()}
        className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
        data-testid="button-refresh-connection"
      >
        <i className="fas fa-sync-alt"></i>
      </button>
    </div>
  );
}
