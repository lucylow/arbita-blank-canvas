import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Key, Bell, Shield, Database, Save } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground glitch-text" data-text="SYSTEM SETTINGS">SYSTEM SETTINGS</h1>
        <p className="text-muted-foreground font-mono mt-1 text-sm">CONFIGURE NULLAUDIT PARAMETERS</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50 border border-border">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">GENERAL</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">API KEYS</TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">AGENTS</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">NOTIFICATIONS</TabsTrigger>
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reduced Motion</Label>
                      <p className="text-xs text-muted-foreground">Disable glitch effects and animations.</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Archive Reports</Label>
                      <p className="text-xs text-muted-foreground">Automatically archive reports older than 30 days.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data Retention Period (Days)</Label>
                  <Input type="number" defaultValue="90" className="bg-background/50 font-mono" />
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
                  <Input type="number" defaultValue="5" className="bg-background/50 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Pen-Tester Aggression Level (1-10)</Label>
                  <Input type="number" defaultValue="8" className="bg-background/50 font-mono" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Jailbreak Prompts</Label>
                    <p className="text-xs text-muted-foreground">Enable testing with known jailbreak patterns.</p>
                  </div>
                  <Switch checked={true} />
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
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Completion Digest</Label>
                    <p className="text-xs text-muted-foreground">Email summary after each audit run.</p>
                  </div>
                  <Switch checked={false} />
                </div>
                <div className="space-y-2">
                  <Label>Alert Email Address</Label>
                  <Input type="email" defaultValue="admin@nullaudit.io" className="bg-background/50 font-mono" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="ghost">Reset to Defaults</Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
