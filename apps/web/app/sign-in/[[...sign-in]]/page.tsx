import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <SignIn appearance={{
        elements: {
          formButtonPrimary: "bg-red-600 hover:bg-red-700 text-sm normal-case",
          card: "bg-slate-900 border border-white/10"
        }
      }} />
    </div>
  );
}