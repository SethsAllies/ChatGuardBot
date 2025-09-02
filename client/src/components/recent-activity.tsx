import { useQuery } from "@tanstack/react-query";
import type { Log } from "@shared/schema";

export default function RecentActivity() {
  const { data: logs, isLoading } = useQuery<Log[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getActivityIcon = (source: string, level: string) => {
    if (level === 'error') return { icon: 'fas fa-exclamation-triangle', color: 'destructive' };
    
    switch (source) {
      case 'whatsapp':
        return { icon: 'fas fa-user-plus', color: 'primary' };
      case 'music':
        return { icon: 'fas fa-music', color: 'chart-3' };
      case 'commands':
        return { icon: 'fas fa-terminal', color: 'accent' };
      default:
        return { icon: 'fas fa-cog', color: 'accent' };
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentLogs = logs?.slice(0, 5) || [];

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4" data-testid="recent-activity-list">
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            recentLogs.map((log) => {
              const { icon, color } = getActivityIcon(log.source, log.level);
              return (
                <div key={log.id} className="flex items-start space-x-3" data-testid={`activity-item-${log.id}`}>
                  <div className={`w-8 h-8 bg-${color}/10 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`${icon} text-${color} text-xs`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(log.createdAt ? new Date(log.createdAt) : new Date())}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
