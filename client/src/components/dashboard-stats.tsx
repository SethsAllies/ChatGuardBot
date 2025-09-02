import { useQuery } from "@tanstack/react-query";
import type { Stats } from "@shared/schema";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statCards = [
    {
      title: "Active Groups",
      value: stats?.activeGroups || 0,
      change: "+2",
      changeText: "this week",
      icon: "fas fa-users",
      color: "primary",
    },
    {
      title: "Commands Today",
      value: stats?.commandsToday || 0,
      change: "+15%",
      changeText: "from yesterday",
      icon: "fas fa-terminal",
      color: "accent",
    },
    {
      title: "Music Requests",
      value: stats?.musicRequests || 0,
      change: "",
      changeText: "24h average",
      icon: "fas fa-music",
      color: "chart-3",
    },
    {
      title: "Uptime",
      value: stats?.uptime || "0%",
      change: "",
      changeText: "7 days",
      icon: "fas fa-clock",
      color: "chart-1",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-8 bg-muted rounded w-16 mb-4"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div key={index} className="bg-card rounded-lg border border-border p-6" data-testid={`stat-card-${card.title.toLowerCase().replace(' ', '-')}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-3xl font-bold" data-testid={`stat-value-${card.title.toLowerCase().replace(' ', '-')}`}>
                {card.value}
              </p>
            </div>
            <div className={`w-12 h-12 bg-${card.color}/10 rounded-lg flex items-center justify-center`}>
              <i className={`${card.icon} text-${card.color} text-xl`}></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {card.change && (
              <span className="text-primary">{card.change}</span>
            )}
            <span className={`text-muted-foreground ${card.change ? 'ml-1' : ''}`}>
              {card.changeText}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
