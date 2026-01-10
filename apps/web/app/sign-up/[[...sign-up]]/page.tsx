import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <SignUp appearance={{
        elements: {
          formButtonPrimary: "bg-red-600 hover:bg-red-700 text-sm normal-case",
          card: "bg-slate-900 border border-white/10"
        }
      }} />
    </div>
  );
}