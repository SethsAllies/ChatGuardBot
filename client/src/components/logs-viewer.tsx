import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Log } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function LogsViewer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: logs, isLoading } = useQuery<Log[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/logs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({ title: "Logs cleared successfully" });
    },
    onError: () => {
      toast({ title: "Failed to clear logs", variant: "destructive" });
    },
  });

  const filteredLogs = logs?.filter(log => {
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;
    const matchesSearch = searchQuery === "" || log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSource && matchesSearch;
  }) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'primary';
      case 'warning': return 'yellow-500';
      case 'error': return 'destructive';
      default: return 'muted';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'whatsapp': return 'primary';
      case 'commands': return 'chart-1';
      case 'music': return 'chart-3';
      case 'system': return 'accent';
      default: return 'muted';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">System Logs</h3>
          <p className="text-sm text-muted-foreground">Monitor bot activity and debug issues</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary"
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending}
            data-testid="button-clear-logs"
          >
            <i className="fas fa-trash mr-2"></i>
            Clear Logs
          </Button>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/logs"] })}
            data-testid="button-refresh-logs"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </Button>
        </div>
      </div>

      {/* Log Filters */}
      <div className="bg-card rounded-lg border border-border mb-6">
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32" data-testid="select-log-level">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-32" data-testid="select-log-source">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="commands">Commands</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="search"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0"
              data-testid="input-search-logs"
            />
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Recent Logs</h4>
            <span className="text-sm text-muted-foreground">
              Last updated: <span data-testid="logs-last-updated">{new Date().toLocaleTimeString()}</span>
            </span>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4">
                  <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No logs found matching the current filters.
            </div>
          ) : (
            <div className="font-mono text-sm" data-testid="logs-list">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start space-x-4 p-4 border-b border-border hover:bg-muted/50"
                  data-testid={`log-item-${log.id}`}
                >
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(log.createdAt ? new Date(log.createdAt) : new Date())}
                  </div>
                  <div className="w-16">
                    <span className={`inline-flex px-2 py-1 bg-${getLevelColor(log.level)}/10 text-${getLevelColor(log.level)} rounded text-xs font-medium uppercase`}>
                      {log.level}
                    </span>
                  </div>
                  <div className="w-20">
                    <span className={`inline-flex px-2 py-1 bg-${getSourceColor(log.source)}/10 text-${getSourceColor(log.source)} rounded text-xs font-medium uppercase`}>
                      {log.source}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p>{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
