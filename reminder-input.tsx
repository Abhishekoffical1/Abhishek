import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Mic, MicOff, Plus, Loader2 } from "lucide-react";
import type { InsertReminder } from "@shared/schema";

export function ReminderInput() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Personal");
  const [important, setImportant] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isListening, startListening, stopListening, transcript, isSupported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && !isListening) {
      setContent(prev => prev ? prev + ' ' + transcript : transcript);
    }
  }, [transcript, isListening]);

  const createReminderMutation = useMutation({
    mutationFn: async (reminder: InsertReminder) => {
      const response = await apiRequest("POST", "/api/reminders", reminder);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setContent("");
      setImportant(false);
      toast({ title: "Success", description: "Reminder saved successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save reminder. Please try again.",
        variant: "destructive"
      });
    },
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter a reminder",
        variant: "destructive"
      });
      return;
    }

    createReminderMutation.mutate({
      content: content.trim(),
      category,
      important,
    });
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        setContent(transcript);
      }
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  const displayContent = content || transcript;
  const characterCount = displayContent.length;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Add New Reminder</h2>
        <p className="text-gray-600 text-sm">Write or speak your reminder to save it for later</p>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder="Type your reminder here... (e.g., 'Remember to call mom at 3 PM' or 'Meeting notes from project discussion')"
            value={displayContent}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] pr-20 resize-none"
          />
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            {isSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={`p-2 ${isListening ? 'text-red-600 bg-red-50 voice-listening' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
                title={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <span className="text-xs text-gray-600">{characterCount}/500</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 reminder-input-actions">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="important"
                checked={important}
                onCheckedChange={(checked) => setImportant(checked === true)}
              />
              <Label htmlFor="important" className="text-sm text-gray-600">
                Mark as important
              </Label>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSave}
            disabled={createReminderMutation.isPending || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {createReminderMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Save Reminder
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
