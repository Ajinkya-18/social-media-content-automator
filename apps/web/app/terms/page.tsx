export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-slate-300">
      <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>By accessing AfterGlow, you agree to be bound by these Terms of Service.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">2. Usage License</h2>
          <p>Permission is granted to use AfterGlow for personal or commercial content creation in accordance with your subscription plan.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">3. Disclaimer</h2>
          <p>The software is provided "as is". AfterGlow makes no warranties, expressed or implied.</p>
        </section>
      </div>
    </div>
  );
}