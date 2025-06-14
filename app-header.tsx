import { useQuery } from "@tanstack/react-query";
import type { Reminder } from "@shared/schema";

export function AppHeader() {
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MemoryKeeper</h1>
          </div>
          <div className="text-sm text-gray-600">
            <i className="fas fa-shield-alt mr-1"></i>
            <span>{reminders.length}</span> reminders saved
          </div>
        </div>
      </div>
    </header>
  );
}
