import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Group } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function GroupsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    refetchInterval: 30000,
  });

  const refreshGroupsMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/groups"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Groups refreshed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to refresh groups", variant: "destructive" });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiRequest("DELETE", `/api/groups/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Left group successfully" });
    },
    onError: () => {
      toast({ title: "Failed to leave group", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Group Management</h3>
            <p className="text-sm text-muted-foreground">Manage groups and moderation settings</p>
          </div>
          <Button disabled>
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Groups
          </Button>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Group Management</h3>
          <p className="text-sm text-muted-foreground">Manage groups and moderation settings</p>
        </div>
        <Button 
          onClick={() => refreshGroupsMutation.mutate()}
          disabled={refreshGroupsMutation.isPending}
          data-testid="button-refresh-groups"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh Groups
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium">Group Name</th>
                <th className="text-left p-4 font-medium">Members</th>
                <th className="text-left p-4 font-medium">Admin Status</th>
                <th className="text-left p-4 font-medium">Moderation</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No groups found. Make sure the bot is connected to WhatsApp.
                  </td>
                </tr>
              ) : (
                groups?.map((group) => (
                  <tr key={group.id} data-testid={`group-row-${group.id}`}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <i className="fas fa-users text-primary"></i>
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`group-name-${group.id}`}>{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm" data-testid={`group-members-${group.id}`}>{group.memberCount}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        group.isAdmin 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {group.isAdmin ? 'Admin' : 'Member'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {group.antiSpam && (
                          <span className="inline-flex px-2 py-1 bg-chart-1/10 text-chart-1 rounded text-xs">
                            Anti-spam
                          </span>
                        )}
                        {group.antiLink && (
                          <span className="inline-flex px-2 py-1 bg-chart-3/10 text-chart-3 rounded text-xs">
                            Anti-link
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button 
                          className="text-muted-foreground hover:text-foreground"
                          title="Manage Group"
                          data-testid={`button-manage-${group.id}`}
                        >
                          <i className="fas fa-cog"></i>
                        </button>
                        <button 
                          onClick={() => leaveGroupMutation.mutate(group.id)}
                          disabled={leaveGroupMutation.isPending}
                          className="text-muted-foreground hover:text-destructive"
                          title="Leave Group"
                          data-testid={`button-leave-${group.id}`}
                        >
                          <i className="fas fa-sign-out-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
