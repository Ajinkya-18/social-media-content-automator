import { Mail } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-white mb-6">Contact Support</h1>
      <p className="text-slate-400 mb-8">
        Have a question or found a bug? Our team is ready to help.
      </p>
      
      <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
        <p className="text-slate-400 mb-6">We usually respond within 24 hours.</p>
        <a 
            href="mailto:support@afterglow.app" 
            className="text-cyan-400 hover:text-cyan-300 font-bold text-lg hover:underline"
        >
            support@afterglow.app
        </a>
      </div>
    </div>
  );
}