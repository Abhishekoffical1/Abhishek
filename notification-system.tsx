import { Button } from "@/components/ui/button";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import type { Reminder } from "@shared/schema";

export function NotificationSystem() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderInterval, setReminderInterval] = useState<NodeJS.Timeout | null>(null);
  const { speak, speaking, stop, supported } = useSpeechSynthesis();

  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const importantReminders = reminders.filter(r => r.important);

  useEffect(() => {
    if (notificationsEnabled && importantReminders.length > 0) {
      const interval = setInterval(() => {
        announceImportantReminders();
      }, 30000); // Announce every 30 seconds
      
      setReminderInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (reminderInterval) {
      clearInterval(reminderInterval);
      setReminderInterval(null);
    }
  }, [notificationsEnabled, importantReminders.length]);

  const announceImportantReminders = () => {
    if (importantReminders.length === 0) return;
    
    const message = importantReminders.length === 1 
      ? `You have an important reminder: ${importantReminders[0].content}`
      : `You have ${importantReminders.length} important reminders. ${importantReminders.slice(0, 3).map(r => r.content).join('. ')}`;
    
    speak(message);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    
    if (!notificationsEnabled && importantReminders.length > 0) {
      // Announce immediately when enabling
      setTimeout(() => announceImportantReminders(), 1000);
    }
  };

  if (!supported) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 speech-controls">
      <div className="flex flex-col space-y-2">
        <Button
          variant={notificationsEnabled ? "default" : "outline"}
          size="sm"
          onClick={toggleNotifications}
          className={`w-12 h-12 rounded-full shadow-lg ${
            notificationsEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50'
          }`}
          title={notificationsEnabled ? "Disable voice notifications" : "Enable voice notifications"}
        >
          {notificationsEnabled ? (
            <Bell className="h-5 w-5 text-white" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </Button>
        
        {speaking && (
          <Button
            variant="outline"
            size="sm"
            onClick={stop}
            className="w-12 h-12 rounded-full shadow-lg bg-red-50 hover:bg-red-100 border-red-200"
            title="Stop speaking"
          >
            <VolumeX className="h-5 w-5 text-red-600" />
          </Button>
        )}
        
        {notificationsEnabled && importantReminders.length > 0 && (
          <div className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center absolute -top-2 -right-2">
            {importantReminders.length}
          </div>
        )}
      </div>
    </div>
  );
}