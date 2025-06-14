import { AppHeader } from "@/components/app-header";
import { ReminderInput } from "@/components/reminder-input";
import { ReminderList } from "@/components/reminder-list";
import { AIHelper } from "@/components/ai-helper";
import { NotificationSystem } from "@/components/notification-system";
import { useState } from "react";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 md:pb-8">
        <ReminderInput />
        <ReminderList 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <AIHelper />
        
        {/* Settings Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enable voice input</span>
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    defaultChecked 
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Dark mode</span>
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Email notifications</span>
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Storage Info</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Storage type:</span>
                  <span>Local Memory</span>
                </div>
                <div className="flex justify-between">
                  <span>Last backup:</span>
                  <span>Never</span>
                </div>
                <button className="mt-3 text-blue-600 hover:text-blue-700 transition-colors duration-200 text-sm">
                  <i className="fas fa-download mr-1"></i>
                  Export all reminders
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <NotificationSystem />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 text-blue-600">
            <i className="fas fa-plus text-lg"></i>
            <span className="text-xs">Add</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-600">
            <i className="fas fa-list text-lg"></i>
            <span className="text-xs">Reminders</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-600">
            <i className="fas fa-robot text-lg"></i>
            <span className="text-xs">AI Helper</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-600">
            <i className="fas fa-cog text-lg"></i>
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
