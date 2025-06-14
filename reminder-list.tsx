import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { Volume2, VolumeX, MessageSquare, Trash2, Play, Pause } from "lucide-react";
import type { Reminder } from "@shared/schema";

interface ReminderListProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function ReminderList({ selectedCategory, onCategoryChange }: ReminderListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { speak, speaking, stop, supported } = useSpeechSynthesis();

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders", selectedCategory !== "all" ? selectedCategory : undefined].filter(Boolean),
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Success", description: "Reminder deleted successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete reminder",
        variant: "destructive"
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      deleteReminderMutation.mutate(id);
    }
  };

  const handleAskAI = (reminder: Reminder) => {
    // This would scroll to AI section and pre-fill with context about the reminder
    const aiInput = document.getElementById('aiInput') as HTMLInputElement;
    if (aiInput) {
      aiInput.value = `Tell me more about this reminder: "${reminder.content}"`;
      aiInput.focus();
      // Scroll to AI section
      document.getElementById('ai-helper')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSpeak = (reminder: Reminder) => {
    const text = `${reminder.important ? 'Important reminder: ' : 'Reminder: '} ${reminder.content}`;
    speak(text);
  };

  const handleSpeakAll = () => {
    if (reminders.length === 0) {
      speak("You have no reminders.");
      return;
    }
    
    const text = reminders.map((r, index) => 
      `${index + 1}. ${r.important ? 'Important: ' : ''}${r.content}`
    ).join('. ');
    
    speak(`You have ${reminders.length} reminder${reminders.length > 1 ? 's' : ''}. ${text}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Personal': return 'bg-blue-100 text-blue-800';
      case 'Work': return 'bg-green-100 text-green-800';
      case 'Health': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Reminders</h2>
          <div className="flex items-center space-x-3">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {supported && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSpeakAll}
                  disabled={speaking || reminders.length === 0}
                  className="flex items-center space-x-2"
                >
                  {speaking ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span className="hidden sm:inline">
                    {speaking ? 'Speaking...' : 'Read All'}
                  </span>
                </Button>
                {speaking && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={stop}
                    className="flex items-center space-x-2"
                  >
                    <VolumeX className="h-4 w-4" />
                    <span className="hidden sm:inline">Stop</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="p-12 text-center">
          <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders yet</h3>
          <p className="text-gray-600">
            {selectedCategory === "all" 
              ? "Add your first reminder above to get started!" 
              : `No reminders found in the ${selectedCategory} category.`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="p-6 hover:bg-gray-50 transition-colors duration-200 group reminder-item">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getCategoryColor(reminder.category)}>
                      {reminder.category}
                    </Badge>
                    {reminder.important && (
                      <Badge className="bg-red-100 text-red-800">
                        Important
                      </Badge>
                    )}
                    <span className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(reminder.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2 leading-relaxed">{reminder.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {supported && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeak(reminder)}
                        className="p-0 h-auto hover:text-blue-600 flex items-center"
                        disabled={speaking}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Speak
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAskAI(reminder)}
                      className="p-0 h-auto hover:text-blue-600 flex items-center"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Ask AI
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                      className="p-0 h-auto hover:text-red-600 flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button variant="ghost" size="sm" className="p-2">
                    <i className="fas fa-ellipsis-v"></i>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reminders.length > 0 && (
        <div className="p-6 border-t border-gray-200 text-center">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <i className="fas fa-chevron-down mr-2"></i>
            Showing all reminders
          </Button>
        </div>
      )}
    </section>
  );
}
