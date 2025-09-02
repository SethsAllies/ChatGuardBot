import { useState } from "react";
import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import RecentActivity from "@/components/recent-activity";
import QuickActions from "@/components/quick-actions";
import ConnectionStatus from "@/components/connection-status";
import GroupsTable from "@/components/groups-table";
import CommandsList from "@/components/commands-list";
import LogsViewer from "@/components/logs-viewer";
import QRCodeDisplay from "@/components/qr-code-display";

type TabType = 'dashboard' | 'connection' | 'groups' | 'commands' | 'music' | 'logs' | 'settings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'connection': return 'Connection';
      case 'groups': return 'Group Management';
      case 'commands': return 'Bot Commands';
      case 'music': return 'Music Queue';
      case 'logs': return 'System Logs';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getTabDescription = (tab: TabType) => {
    switch (tab) {
      case 'dashboard': return 'Monitor and manage your WhatsApp bot';
      case 'connection': return 'Manage WhatsApp connection and authentication';
      case 'groups': return 'Manage groups and moderation settings';
      case 'commands': return 'Configure and manage bot commands';
      case 'music': return 'View and manage music queue';
      case 'logs': return 'Monitor bot activity and debug issues';
      case 'settings': return 'Configure bot settings and preferences';
      default: return 'Monitor and manage your WhatsApp bot';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{getTabTitle(activeTab)}</h2>
              <p className="text-muted-foreground">{getTabDescription(activeTab)}</p>
            </div>
            <ConnectionStatus />
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full">
          {activeTab === 'dashboard' && (
            <div>
              <DashboardStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RecentActivity />
                <QuickActions onTabChange={(tab: string) => setActiveTab(tab as TabType)} />
              </div>
              <div className="bg-card rounded-lg border border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold">Connection Status</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className="fab fa-whatsapp text-primary"></i>
                      </div>
                      <div>
                        <p className="font-medium">WhatsApp Web</p>
                        <p className="text-sm text-primary">Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-server text-chart-1"></i>
                      </div>
                      <div>
                        <p className="font-medium">Bot Server</p>
                        <p className="text-sm text-primary">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-database text-chart-3"></i>
                      </div>
                      <div>
                        <p className="font-medium">Database</p>
                        <p className="text-sm text-primary">Connected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connection' && (
            <div className="max-w-4xl mx-auto">
              <QRCodeDisplay />
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="max-w-6xl mx-auto">
              <GroupsTable />
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="max-w-6xl mx-auto">
              <CommandsList />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="max-w-6xl mx-auto">
              <LogsViewer />
            </div>
          )}

          {(activeTab === 'music' || activeTab === 'settings') && (
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">This section is under development.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
