"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2, Plus, Loader2 } from "lucide-react";

export default function SchedulerPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  
  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('yt_email');
    if (storedEmail) {
      setEmail(storedEmail);
      fetchEvents(storedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchEvents = async (userEmail: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/calendar/events?email=${userEmail}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Calendar error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/calendar/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newEvent, email })
        });
        
        if (res.ok) {
            setIsCreating(false);
            setNewEvent({ title: '', date: '', description: '' });
            fetchEvents(email); // Refresh list
        } else {
            alert("Failed to create event");
        }
    } catch (err) {
        console.error(err);
    } finally {
        setSubmitting(false);
    }
  };

  // --- LOGIC: Sort and Filter Events ---
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const overdue = events.filter(e => (e.start.date || e.start.dateTime) < todayStr);
  const today = events.filter(e => (e.start.date || e.start.dateTime).startsWith(todayStr));
  
  // FIX: Changed from '>' to '>=' so Today is included in the main list
  const agenda = events.filter(e => (e.start.date || e.start.dateTime) >= todayStr);
  
  const tomorrowEvents = events.filter(e => (e.start.date || e.start.dateTime).startsWith(tomorrowStr));

  if (!email) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <CalendarIcon className="w-16 h-16 text-slate-600" />
            <h2 className="text-2xl font-bold text-white">Connect Scheduler</h2>
            <p className="text-slate-400">Please connect your YouTube/Google account in the Dashboard first.</p>
        </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarIcon className="text-purple-400 w-8 h-8" />
            Content Scheduler
          </h2>
          <p className="text-slate-400 mt-1">Plan your uploads and track deadlines.</p>
        </div>
        <button 
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all"
        >
            <Plus className="w-5 h-5" /> New Task
        </button>
      </div>

      {/* CREATE FORM */}
      {isCreating && (
          <form onSubmit={handleCreate} className="glass-panel p-6 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-4">
              <h3 className="text-white font-bold">New Content Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    required type="text" placeholder="Content Title (e.g., 'New Vlog')" 
                    className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                    value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                  <input 
                    required type="date" 
                    className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                    value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="Description / Notes" 
                    className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                    value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  />
              </div>
              <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                  <button disabled={submitting} type="submit" className="px-6 py-2 bg-white text-purple-900 font-bold rounded-lg hover:bg-slate-200">
                      {submitting ? 'Saving...' : 'Save to Calendar'}
                  </button>
              </div>
          </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: STATUS LISTS */}
          <div className="space-y-6">
              
              {/* Overdue */}
              {overdue.length > 0 && (
                  <div className="glass-panel p-5 rounded-xl border-l-4 border-red-500 bg-red-500/5">
                      <h4 className="text-red-400 font-bold flex items-center gap-2 mb-3">
                          <AlertCircle className="w-4 h-4" /> Missed / Overdue
                      </h4>
                      <div className="space-y-2">
                          {overdue.map(e => (
                              <div key={e.id} className="text-sm text-slate-300 p-2 bg-black/20 rounded">
                                  <span className="text-white font-medium block">{e.summary}</span>
                                  <span className="text-xs opacity-70">Due: {e.start.date || e.start.dateTime?.split('T')[0]}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Today */}
              <div className="glass-panel p-5 rounded-xl border-l-4 border-green-500 bg-green-500/5">
                  <h4 className="text-green-400 font-bold flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4" /> Today's Focus
                  </h4>
                  {today.length === 0 ? <p className="text-slate-500 text-sm">No tasks for today.</p> : (
                      <div className="space-y-2">
                          {today.map(e => (
                              <div key={e.id} className="text-sm text-white p-3 bg-white/10 rounded flex justify-between items-center">
                                  <span>{e.summary}</span>
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Tomorrow */}
              <div className="glass-panel p-5 rounded-xl border border-white/5">
                  <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-3">
                      Tomorrow
                  </h4>
                  {tomorrowEvents.length === 0 ? <p className="text-slate-500 text-sm">Nothing scheduled.</p> : (
                      <div className="space-y-2">
                          {tomorrowEvents.map(e => (
                              <div key={e.id} className="text-sm text-slate-400 p-2 bg-white/5 rounded">
                                  {e.summary}
                              </div>
                          ))}
                      </div>
                  )}
              </div>

          </div>

          {/* RIGHT COLUMN: AGENDA & UPCOMING */}
          <div className="lg:col-span-2 glass-panel p-8 rounded-2xl border border-white/5 min-h-[500px]">
              <h3 className="text-xl font-bold text-white mb-6">Agenda & Upcoming</h3>
              
              {loading ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-500 animate-spin"/></div>
              ) : agenda.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">
                      <p>No tasks scheduled.</p>
                      <button onClick={() => setIsCreating(true)} className="text-purple-400 hover:underline mt-2">Add your first task</button>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {agenda.map((e) => {
                          const date = new Date(e.start.date || e.start.dateTime);
                          // Check if it's today for styling
                          const isToday = (e.start.date || e.start.dateTime).startsWith(todayStr);
                          
                          return (
                              <div key={e.id} className={`flex items-start gap-6 p-4 rounded-xl transition-colors border border-white/5 ${isToday ? 'bg-purple-500/10 border-purple-500/30' : 'hover:bg-white/5'}`}>
                                  <div className="text-center w-16 flex-shrink-0 pt-1">
                                      <span className={`block text-xs font-bold uppercase ${isToday ? 'text-purple-300' : 'text-slate-500'}`}>
                                          {date.toLocaleString('default', { month: 'short' })}
                                      </span>
                                      <span className={`block text-2xl font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>
                                          {date.getDate()}
                                      </span>
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                          <h4 className={`text-lg font-medium ${isToday ? 'text-purple-100' : 'text-white'}`}>{e.summary}</h4>
                                          {isToday && <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>}
                                      </div>
                                      
                                      {/* Detail View: Removed line-clamp to show full description */}
                                      <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap">
                                          {e.description?.replace('[Created via AfterGlow]', '') || 'No details provided.'}
                                      </p>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              )}
          </div>

      </div>
    </div>
  );
}