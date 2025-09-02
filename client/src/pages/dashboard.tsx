import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface BotStatus {
  status: string;
  linkCode?: string;
  session?: {
    phoneNumber?: string;
    connectedAt?: string;
    sessionId: string;
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkCode, setLinkCode] = useState("");

  const { data: botStatus, isLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 3000,
  });

  const requestLinkCodeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/request-link", { phoneNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({ title: "Link code requested! Check your WhatsApp for the code." });
    },
    onError: () => {
      toast({ title: "Failed to request link code", variant: "destructive" });
    },
  });

  const submitLinkCodeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/verify-link", { linkCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({ title: "Successfully connected to WhatsApp!" });
    },
    onError: () => {
      toast({ title: "Invalid link code", variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({ title: "Disconnected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fab fa-whatsapp text-primary-foreground text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold">WhatsApp Bot</h1>
          <p className="text-muted-foreground">Connect your WhatsApp account</p>
        </div>

        {/* Connection Status */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Connection Status</h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              botStatus?.status === 'connected' ? 'bg-primary/10 text-primary' :
              botStatus?.status === 'waiting-for-code' ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-muted text-muted-foreground'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                botStatus?.status === 'connected' ? 'bg-primary' :
                botStatus?.status === 'waiting-for-code' ? 'bg-yellow-500' :
                'bg-muted-foreground'
              }`}></div>
              <span>
                {botStatus?.status === 'connected' ? 'Connected' :
                 botStatus?.status === 'waiting-for-code' ? 'Waiting for code' :
                 'Disconnected'}
              </span>
            </div>
          </div>

          {botStatus?.status === 'connected' ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <i className="fas fa-check-circle text-primary text-2xl mb-2"></i>
                <p className="font-medium">WhatsApp Connected!</p>
                <p className="text-sm text-muted-foreground">
                  Phone: {botStatus.session?.phoneNumber || 'Hidden'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Connected: {botStatus.session?.connectedAt ? 
                    new Date(botStatus.session.connectedAt).toLocaleString() : 'Recently'}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-medium mb-2">Available Commands:</h3>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>• <span className="font-mono">/help</span> - Show all commands</p>
                  <p>• <span className="font-mono">/kick @user</span> - Remove member (admin only)</p>
                  <p>• <span className="font-mono">/play song name</span> - Play music</p>
                  <p>• <span className="font-mono">/ping</span> - Check bot response</p>
                  <p className="text-xs pt-2">Use these commands directly in your WhatsApp groups!</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                Disconnect WhatsApp
              </Button>
            </div>
          ) : botStatus?.status === 'waiting-for-code' ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <i className="fas fa-mobile-alt text-yellow-500 text-2xl mb-2"></i>
                <p className="font-medium">Check your WhatsApp!</p>
                <p className="text-sm text-muted-foreground">
                  A link code has been sent to your WhatsApp. Enter it below.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter link code from WhatsApp"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  data-testid="input-link-code"
                />
                <Button 
                  className="w-full"
                  onClick={() => submitLinkCodeMutation.mutate()}
                  disabled={submitLinkCodeMutation.isPending || !linkCode}
                  data-testid="button-submit-code"
                >
                  Connect with Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  data-testid="input-phone-number"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US, +44 for UK)
                </p>
              </div>
              <Button 
                className="w-full"
                onClick={() => requestLinkCodeMutation.mutate()}
                disabled={requestLinkCodeMutation.isPending || !phoneNumber}
                data-testid="button-request-code"
              >
                {requestLinkCodeMutation.isPending ? 'Requesting...' : 'Request Link Code'}
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-3">How it works:</h3>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li>1. Enter your phone number with country code</li>
            <li>2. Click "Request Link Code"</li>
            <li>3. Check your WhatsApp for a message with the link code</li>
            <li>4. Enter the code to connect your account</li>
            <li>5. Use bot commands directly in your WhatsApp groups!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
