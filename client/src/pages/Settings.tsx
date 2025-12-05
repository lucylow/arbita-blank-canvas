import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Key, Bell, Shield, Database, Save } from "lucide-react";
import { showSuccessNotification, showErrorNotification, logError } from "@/lib/error-handler";

interface SettingsState {
  reducedMotion: boolean;
  autoArchive: boolean;
  retentionDays: number;
  maxConcurrentAgents: number;
  penTesterAggression: number;
  allowJailbreak: boolean;
  criticalAlerts: boolean;
  auditDigest: boolean;
  alertEmail: string;
}

export default function Settings() {
  // Load settings from localStorage on mount
  const loadSettings = (): SettingsState => {
    try {
      const saved = localStorage.getItem('nullaudit-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      logError(e as Error, { component: 'Settings', method: 'loadSettings' });
    }
    return {
      reducedMotion: false,
      autoArchive: true,
      retentionDays: 90,
      maxConcurrentAgents: 5,
      penTesterAggression: 8,
      allowJailbreak: true,
      criticalAlerts: true,
      auditDigest: false,
      alertEmail: "admin@nullaudit.io",
    };
  };

  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to backend/localStorage
      localStorage.setItem('nullaudit-settings', JSON.stringify(settings));
      showSuccessNotification('Settings saved successfully');
    } catch (error) {
      showErrorNotification(error, { title: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults: SettingsState = {
      reducedMotion: false,
      autoArchive: true,
      retentionDays: 90,
      maxConcurrentAgents: 5,
      penTesterAggression: 8,
      allowJailbreak: true,
      criticalAlerts: true,
      auditDigest: false,
      alertEmail: "admin@nullaudit.io",
    };
    setSettings(defaults);
    localStorage.removeItem('nullaudit-settings');
    showSuccessNotification('Settings reset to defaults');
  };
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground glitch-text" data-text="SYSTEM SETTINGS">SYSTEM SETTINGS</h1>
        <p className="text-muted-foreground font-mono mt-1 text-sm">CONFIGURE NULLAUDIT PARAMETERS</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50 border border-border">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono transition-all duration-200 hover:bg-secondary">GENERAL</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono transition-all duration-200 hover:bg-secondary">API KEYS</TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono transition-all duration-200 hover:bg-secondary">AGENTS</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono transition-all duration-200 hover:bg-secondary">NOTIFICATIONS</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-primary" />
                  General Configuration
                </CardTitle>
                <CardDescription>System-wide preferences and display settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">Enforce cyber-brutalist dark theme.</p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-sm hover:bg-secondary/30 transition-colors">
                    <div className="space-y-0.5">
                      <Label>Reduced Motion</Label>
                      <p className="text-xs text-muted-foreground">Disable glitch effects and animations.</p>
                    </div>
                    <Switch 
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => setSettings({...settings, reducedMotion: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-sm hover:bg-secondary/30 transition-colors">
                    <div className="space-y-0.5">
                      <Label>Auto-Archive Reports</Label>
                      <p className="text-xs text-muted-foreground">Automatically archive reports older than 30 days.</p>
                    </div>
                    <Switch 
                      checked={settings.autoArchive}
                      onCheckedChange={(checked) => setSettings({...settings, autoArchive: checked})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data Retention Period (Days)</Label>
                  <Input 
                    type="number" 
                    value={settings.retentionDays}
                    onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value) || 90})}
                    className="bg-background/50 font-mono" 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  API Configuration
                </CardTitle>
                <CardDescription>Manage connections to external LLM providers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value="sk-........................" className="bg-background/50 font-mono" readOnly />
                    <Button variant="outline">Update</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Anthropic API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value="sk-ant-...................." className="bg-background/50 font-mono" readOnly />
                    <Button variant="outline">Update</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>NullShot Protocol Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value="ns-........................" className="bg-background/50 font-mono" readOnly />
                    <Button variant="outline">Update</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Agent Parameters
                </CardTitle>
                <CardDescription>Fine-tune the behavior of security agents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Max Concurrent Agents</Label>
                  <Input 
                    type="number" 
                    value={settings.maxConcurrentAgents}
                    onChange={(e) => setSettings({...settings, maxConcurrentAgents: parseInt(e.target.value) || 5})}
                    className="bg-background/50 font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pen-Tester Aggression Level (1-10)</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={settings.penTesterAggression}
                    onChange={(e) => setSettings({...settings, penTesterAggression: parseInt(e.target.value) || 8})}
                    className="bg-background/50 font-mono" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Jailbreak Prompts</Label>
                    <p className="text-xs text-muted-foreground">Enable testing with known jailbreak patterns.</p>
                  </div>
                  <Switch 
                    checked={settings.allowJailbreak}
                    onCheckedChange={(checked) => setSettings({...settings, allowJailbreak: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Alert Preferences
                </CardTitle>
                <CardDescription>Configure when and how you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Critical Vulnerability Alerts</Label>
                    <p className="text-xs text-muted-foreground">Immediate notification for high-severity findings.</p>
                  </div>
                  <Switch 
                    checked={settings.criticalAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, criticalAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Completion Digest</Label>
                    <p className="text-xs text-muted-foreground">Email summary after each audit run.</p>
                  </div>
                  <Switch 
                    checked={settings.auditDigest}
                    onCheckedChange={(checked) => setSettings({...settings, auditDigest: checked})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alert Email Address</Label>
                  <Input 
                    type="email" 
                    value={settings.alertEmail}
                    onChange={(e) => setSettings({...settings, alertEmail: e.target.value})}
                    className="bg-background/50 font-mono" 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="ghost" onClick={handleReset} className="hover:bg-secondary/50 transition-colors">Reset to Defaults</Button>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
