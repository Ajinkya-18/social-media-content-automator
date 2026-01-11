export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-slate-300">
      <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm text-slate-500">Last Updated: January 11, 2026</p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">1. Introduction</h2>
          <p>Welcome to AfterGlow. We respect your privacy and are committed to protecting your personal data.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">2. Data We Collect</h2>
          <p>We collect your email address and authentication tokens (Google, Canva) to provide our services. We do not sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">3. How We Use Data</h2>
          <p>Your data is used solely for functionality: connecting your Canva designs to your YouTube channel and generating AI content.</p>
        </section>
      </div>
    </div>
  );
}