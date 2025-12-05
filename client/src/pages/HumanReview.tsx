import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, XCircle, Edit, Clock, User, Shield, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HumanTask } from '@shared/hitl-types';
import { apiClient, showErrorNotification, showSuccessNotification, logError } from '@/lib/error-handler';

export default function HumanReview() {
  const [tasks, setTasks] = useState<HumanTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<HumanTask | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'ArrowDown' && tasks.length > 0) {
        e.preventDefault();
        const nextIndex = Math.min(selectedIndex + 1, tasks.length - 1);
        setSelectedIndex(nextIndex);
        setSelectedTask(tasks[nextIndex]);
      } else if (e.key === 'ArrowUp' && tasks.length > 0) {
        e.preventDefault();
        const prevIndex = Math.max(selectedIndex - 1, 0);
        setSelectedIndex(prevIndex);
        setSelectedTask(tasks[prevIndex]);
      } else if (e.key === 'a' && selectedTask && !loading) {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'r' && selectedTask && !loading) {
        e.preventDefault();
        handleReject();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [tasks, selectedIndex, selectedTask, loading]);

  // Update selected index when tasks change
  useEffect(() => {
    if (tasks.length > 0 && !selectedTask) {
      setSelectedTask(tasks[0]);
      setSelectedIndex(0);
    }
  }, [tasks, selectedTask]);

  const fetchTasks = async () => {
    try {
      setError(null);
      const response = await fetch('/api/hitl/tasks/pending');
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        // API not available - use empty array (no mock data in production)
        setTasks([]);
        return;
      }
      
      const data = await response.json() as HumanTask[];
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
      }
    } catch (error) {
      // Silently handle network errors - API may not be available
      logError(error instanceof Error ? error : new Error(String(error)), { method: 'fetchTasks', silent: true });
      setTasks([]);
    }
  };

  const handleApprove = async () => {
    if (!selectedTask) return;
    await submitFeedback('approved');
  };

  const handleReject = async () => {
    if (!selectedTask) return;
    await submitFeedback('rejected');
  };

  const handleRequestChanges = async () => {
    if (!selectedTask || !feedback.trim()) return;
    await submitFeedback('modified');
  };

  const submitFeedback = async (action: string) => {
    if (!selectedTask) return;
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post(`/api/hitl/tasks/${selectedTask.id}/feedback`, {
        action,
        comments: feedback,
        reviewerId: 'current_user',
      });
      
      showSuccessNotification('Feedback submitted successfully');
      const nextIndex = Math.min(selectedIndex, tasks.length - 2);
      setSelectedIndex(Math.max(0, nextIndex));
      setSelectedTask(null);
      setFeedback('');
      fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      setError(errorMessage);
      showErrorNotification(error, {
        title: 'Failed to Submit Feedback',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500';
      case 'low': return 'bg-primary/20 text-primary border-primary';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.8) return 'text-primary';
    if (score > 0.6) return 'text-yellow-500';
    return 'text-destructive';
  };

  const navigateTask = useCallback((direction: 'next' | 'prev') => {
    if (tasks.length === 0) return;
    const newIndex = direction === 'next' 
      ? Math.min(selectedIndex + 1, tasks.length - 1)
      : Math.max(selectedIndex - 1, 0);
    setSelectedIndex(newIndex);
    setSelectedTask(tasks[newIndex]);
    setFeedback('');
  }, [tasks, selectedIndex]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground glitch-text" data-text="HUMAN REVIEW">HUMAN REVIEW</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">HITL VERIFICATION QUEUE // PENDING: {tasks.length}</p>
          <p className="text-muted-foreground/60 font-mono text-xs mt-1">
            Keyboard shortcuts: ↑/↓ navigate, A approve, R reject
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500 text-yellow-500 font-mono text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            {tasks.length} AWAITING REVIEW
          </div>
        </div>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/50">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-mono">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Task List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  PENDING REVIEWS
                </CardTitle>
                <Badge variant="outline" className="font-mono border-primary text-primary">
                  {tasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {tasks.map((task, index) => (
                <Card
                  key={task.id}
                  className={cn(
                    "bg-card border-border cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5",
                    selectedTask?.id === task.id && "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,65,0.15)]"
                  )}
                  onClick={() => {
                    setSelectedTask(task);
                    setSelectedIndex(index);
                    setFeedback('');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono text-sm font-bold text-foreground mb-2 truncate">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-xs font-mono", getPriorityColor(task.priority))}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {new Date(task.metadata.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn("font-mono text-xs border-border", getConfidenceColor(task.metadata.confidenceScore))}
                      >
                        {(task.metadata.confidenceScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 font-mono">
                      {task.description.split('\n')[0]}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground font-mono">NO PENDING TASKS</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Review Interface */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTask ? (
            <>
              {/* Task Navigation */}
              {tasks.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateTask('prev')}
                    disabled={selectedIndex === 0}
                    className="font-mono"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    PREVIOUS
                  </Button>
                  <span className="text-xs font-mono text-muted-foreground">
                    {selectedIndex + 1} / {tasks.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateTask('next')}
                    disabled={selectedIndex === tasks.length - 1}
                    className="font-mono"
                  >
                    NEXT
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Task Header */}
              <Card className="bg-card border-border animate-in fade-in slide-in-from-bottom-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-mono mb-2">{selectedTask.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap font-mono text-xs">
                        <span>AGENT: {selectedTask.metadata.agentId}</span>
                        <span>·</span>
                        <Badge className={cn("text-xs font-mono", getPriorityColor(selectedTask.priority))}>
                          {selectedTask.priority.toUpperCase()}
                        </Badge>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {selectedTask.metadata.agentId}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Task Content */}
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-secondary/50 border border-border">
                  <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">DETAILS</TabsTrigger>
                  <TabsTrigger value="evidence" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">EVIDENCE</TabsTrigger>
                  <TabsTrigger value="context" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">CONTEXT</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-foreground bg-background/50 p-4 border border-border">
                        {selectedTask.description}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="evidence">
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <pre className="bg-background/50 p-4 border border-border text-sm overflow-x-auto font-mono text-foreground">
                        {JSON.stringify(selectedTask.payload.evidence, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="context">
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {Object.entries(selectedTask.payload.context || {}).map(([key, value]) => (
                          <div key={key} className="flex border-b border-border pb-2 font-mono">
                            <span className="font-bold w-32 text-foreground">{key.toUpperCase()}:</span>
                            <span className="text-muted-foreground flex-1">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Feedback Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-mono">YOUR REVIEW</CardTitle>
                  <CardDescription className="font-mono text-xs">Provide feedback on this security finding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Add your comments, corrections, or additional context..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full font-mono text-xs bg-background/50 border-input"
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-mono transition-all hover:scale-105 active:scale-95"
                      title="Press 'A' to approve"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      APPROVE <span className="ml-2 text-xs opacity-70">(A)</span>
                    </Button>
                    
                    <Button
                      onClick={handleRequestChanges}
                      disabled={loading || !feedback.trim()}
                      variant="outline"
                      className="flex-1 border-primary text-primary hover:bg-primary/10 font-mono transition-all hover:scale-105 active:scale-95"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      REQUEST CHANGES
                    </Button>
                    
                    <Button
                      onClick={handleReject}
                      disabled={loading}
                      variant="destructive"
                      className="flex-1 font-mono transition-all hover:scale-105 active:scale-95"
                      title="Press 'R' to reject"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      REJECT <span className="ml-2 text-xs opacity-70">(R)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-12">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold font-mono text-foreground mb-2">
                    NO TASK SELECTED
                  </h3>
                  <p className="text-muted-foreground font-mono">
                    Select a task from the list to begin review
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
