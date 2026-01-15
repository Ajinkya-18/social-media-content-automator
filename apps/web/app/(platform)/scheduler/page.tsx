"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Calendar, Plus, Clock, CheckCircle2, Loader2, RefreshCw, Undo2 } from "lucide-react";

export default function SchedulerPage() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const res = await fetch(`${apiUrl}/calendar/events?email=${email}`);
      if (res.ok) {
        const data = await res.json();
        
        // Transform Google Calendar events to Kanban format
        const formattedTasks = data.map((ev: any) => ({
           id: ev.id,
           title: ev.summary,
           description: ev.description || "",
           date: new Date(ev.start.date || ev.start.dateTime).toLocaleDateString(),
           // The "Truth" is now in the description tag, not just the date
           status: determineStatus(ev) 
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error("Calendar Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const determineStatus = (ev: any) => {
      // 1. Explicit Completion Check
      if (ev.description && ev.description.includes("[COMPLETED]")) {
          return 'done';
      }

      // 2. Date-based fallback
      const taskDate = new Date(ev.start.date || ev.start.dateTime);
      const today = new Date();
      
      // If it's in the past but NOT marked complete, it's "Overdue" or just "In Production"
      // For simplicity, let's keep it in 'todo' so user is forced to mark it done
      if (Math.abs(taskDate.getTime() - today.getTime()) < 86400000 * 7) return 'todo'; // Within 7 days
      
      return 'idea';
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      setProcessingId(taskId);
      
      // Toggle logic
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';

      try {
          const res = await fetch(`${apiUrl}/calendar/mark-complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email,
                  event_id: taskId,
                  status: newStatus
              })
          });

          if (res.ok) {
              // Optimistic UI Update (Instant feedback)
              setTasks(prev => prev.map(t => 
                  t.id === taskId ? { ...t, status: newStatus } : t
              ));
              // Background fetch to confirm color/metadata sync
              fetchEvents();
          }
      } catch (error) {
          alert("Failed to update task");
      } finally {
          setProcessingId(null);
      }
  };

  const handleCreateTask = async () => {
      const title = prompt("Enter Content Title:");
      if (!title) return;
      const date = prompt("Enter Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
      if (!date) return;

      try {
          setCreating(true);
          const email = user?.primaryEmailAddress?.emailAddress;
          const res = await fetch(`${apiUrl}/calendar/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email,
                  title: title,
                  description: "Scheduled via AfterGlow Scheduler",
                  date: date
              })
          });

          if (res.ok) {
              fetchEvents();
          } else {
              alert("Failed to create event. Ensure Google Calendar permissions are granted.");
          }
      } catch (e) {
          alert("Error creating task");
      } finally {
          setCreating(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-cyan-400" />
            Content <span className="bg-gradient-to-r from-orange-400 to-amber-600 text-transparent bg-clip-text">Timeline</span>
          </h1>
          <p className="text-slate-400">Syncs directly with your Google Calendar.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={fetchEvents} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={handleCreateTask}
                disabled={creating}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center gap-2"
            >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} 
                New Drop
            </button>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column 
            title="Upcoming / Ideas" 
            color="cyan" 
            tasks={tasks.filter(t => t.status === 'idea')} 
            onToggle={toggleTaskStatus} 
            processingId={processingId}
        />
        <Column 
            title="In Production" 
            color="blue" 
            tasks={tasks.filter(t => t.status === 'todo')} 
            onToggle={toggleTaskStatus} 
            processingId={processingId}
        />
        <Column 
            title="Published / Done" 
            color="orange" 
            tasks={tasks.filter(t => t.status === 'done')} 
            onToggle={toggleTaskStatus} 
            processingId={processingId}
        />
      </div>
    </div>
  );
}

function Column({ title, color, tasks, onToggle, processingId }: any) {
    const colors: any = {
        cyan: "bg-cyan-500",
        blue: "bg-blue-500",
        orange: "bg-orange-500"
    };

    const borderColors: any = {
        cyan: "border-l-cyan-500",
        blue: "border-l-blue-500",
        orange: "border-l-orange-500"
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${colors[color]}`} />
                <h3 className="font-bold text-slate-300 uppercase text-sm tracking-wider">{title}</h3>
                <span className="ml-auto text-xs text-slate-600 font-mono">{tasks.length}</span>
            </div>
            
            <div className="space-y-3 min-h-[200px]">
                {tasks.map((task: any) => (
                    <div key={task.id} className={`p-5 rounded-xl bg-[#0b1121] border border-white/5 border-l-4 ${borderColors[color]} hover:translate-y-[-2px] transition-transform shadow-lg group relative`}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 pr-8">{task.title}</h4>
                            
                            {/* MARK COMPLETE ACTION */}
                            <button 
                                onClick={() => onToggle(task.id, task.status)}
                                disabled={processingId === task.id}
                                className={`absolute top-4 right-4 p-1.5 rounded-full transition-all ${
                                    task.status === 'done' 
                                    ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/40' 
                                    : 'bg-white/5 text-slate-500 hover:bg-green-500 hover:text-white'
                                }`}
                                title={task.status === 'done' ? "Mark as Incomplete" : "Mark as Complete"}
                            >
                                {processingId === task.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : task.status === 'done' ? (
                                    <Undo2 className="w-4 h-4" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.date}</span>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="h-32 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-slate-600 text-sm italic">
                        Empty
                    </div>
                )}
            </div>
        </div>
    )
}