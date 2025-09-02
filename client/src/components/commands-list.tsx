import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Command } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CommandsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: commands, isLoading } = useQuery<Command[]>({
    queryKey: ["/api/commands"],
  });

  const toggleCommandMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => 
      apiRequest("PUT", `/api/commands/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commands"] });
      toast({ title: "Command updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update command", variant: "destructive" });
    },
  });

  const getCommands = (category: string) => {
    return commands?.filter(cmd => cmd.category === category) || [];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'moderation': return 'fas fa-shield-alt';
      case 'music': return 'fas fa-music';
      case 'utility': return 'fas fa-tools';
      default: return 'fas fa-terminal';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'moderation': return 'primary';
      case 'music': return 'chart-3';
      case 'utility': return 'accent';
      default: return 'muted';
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Bot Commands</h3>
            <p className="text-sm text-muted-foreground">Configure and manage bot commands</p>
          </div>
          <Button disabled>
            <i className="fas fa-plus mr-2"></i>
            Add Command
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
              </div>
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const categories = ['moderation', 'music', 'utility'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Bot Commands</h3>
          <p className="text-sm text-muted-foreground">Configure and manage bot commands</p>
        </div>
        <Button data-testid="button-add-command">
          <i className="fas fa-plus mr-2"></i>
          Add Command
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryCommands = getCommands(category);
          const categoryIcon = getCategoryIcon(category);
          const categoryColor = getCategoryColor(category);

          return (
            <div key={category} className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h4 className="font-semibold flex items-center">
                  <i className={`${categoryIcon} text-${categoryColor} mr-2`}></i>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
              </div>
              <div className="p-4 space-y-3" data-testid={`commands-category-${category}`}>
                {categoryCommands.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No commands in this category
                  </p>
                ) : (
                  categoryCommands.map((command) => (
                    <div 
                      key={command.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                      data-testid={`command-item-${command.name.replace('/', '')}`}
                    >
                      <div>
                        <p className="font-medium text-sm">{command.name}</p>
                        <p className="text-xs text-muted-foreground">{command.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          command.enabled ? `bg-${categoryColor}` : 'bg-muted-foreground'
                        }`}></span>
                        <button 
                          onClick={() => toggleCommandMutation.mutate({ 
                            id: command.id, 
                            enabled: !command.enabled 
                          })}
                          disabled={toggleCommandMutation.isPending}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid={`button-toggle-${command.name.replace('/', '')}`}
                        >
                          <i className="fas fa-cog text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
