import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, XCircle, Edit, Clock, User, Shield } from 'lucide-react';
import type { HumanTask } from '@/../../shared/hitl-types';

export default function HumanReview() {
  const [tasks, setTasks] = useState<HumanTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<HumanTask | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/hitl/tasks/pending');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
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
    
    try {
      await fetch(`/api/hitl/tasks/${selectedTask.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comments: feedback,
          reviewerId: 'current_user',
        }),
      });
      
      setSelectedTask(null);
      setFeedback('');
      fetchTasks();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.8) return 'text-green-600';
    if (score > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Task List */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Pending Reviews
            </h2>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {tasks.length}
            </Badge>
          </div>
          
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTask?.id === task.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.metadata.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`${getConfidenceColor(task.metadata.confidenceScore)} font-semibold`}
                    >
                      {(task.metadata.confidenceScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {task.description.split('\n')[0]}
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">No pending tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Review Interface */}
      <div className="flex-1 overflow-y-auto">
        {selectedTask ? (
          <div className="p-6 space-y-6">
            {/* Task Header */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{selectedTask.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <span>Requested by {selectedTask.metadata.agentId}</span>
                      <span>·</span>
                      <Badge className={getPriorityColor(selectedTask.priority)}>
                        {selectedTask.priority}
                      </Badge>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {selectedTask.metadata.agentId}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Task Content */}
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                <TabsTrigger value="context">Context</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardContent className="p-6">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {selectedTask.description}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evidence">
                <Card>
                  <CardContent className="p-6">
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedTask.payload.evidence, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="context">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Object.entries(selectedTask.payload.context || {}).map(([key, value]) => (
                        <div key={key} className="flex border-b pb-2">
                          <span className="font-medium w-32 text-gray-700">{key}:</span>
                          <span className="text-gray-900 flex-1">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Feedback Section */}
            <Card>
              <CardHeader>
                <CardTitle>Your Review</CardTitle>
                <CardDescription>Provide feedback on this security finding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add your comments, corrections, or additional context..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full"
                />
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  
                  <Button
                    onClick={handleRequestChanges}
                    disabled={loading || !feedback.trim()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                  
                  <Button
                    onClick={handleReject}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Task Selected
              </h3>
              <p className="text-gray-500">
                Select a task from the list to begin review
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
