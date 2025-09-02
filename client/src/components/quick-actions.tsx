interface QuickActionsProps {
  onTabChange: (tab: string) => void;
}

export default function QuickActions({ onTabChange }: QuickActionsProps) {
  const actions = [
    {
      id: 'broadcast',
      icon: 'fas fa-bullhorn',
      label: 'Broadcast',
      color: 'primary',
      action: () => {
        // TODO: Implement broadcast modal
        alert('Broadcast feature coming soon!');
      }
    },
    {
      id: 'manage-groups',
      icon: 'fas fa-users-cog',
      label: 'Manage Groups',
      color: 'chart-3',
      action: () => onTabChange('groups')
    },
    {
      id: 'view-logs',
      icon: 'fas fa-file-alt',
      label: 'View Logs',
      color: 'accent',
      action: () => onTabChange('logs')
    },
    {
      id: 'bot-settings',
      icon: 'fas fa-robot',
      label: 'Bot Settings',
      color: 'chart-1',
      action: () => onTabChange('settings')
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`flex flex-col items-center justify-center p-4 bg-${action.color}/10 hover:bg-${action.color}/20 rounded-lg transition-colors text-center`}
              data-testid={`quick-action-${action.id}`}
            >
              <i className={`${action.icon} text-${action.color} text-xl mb-2`}></i>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
