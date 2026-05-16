import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-linear-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-10 h-10 bg-linear-indigo rounded-lg rotate-45 mx-auto mb-4 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm -rotate-45" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-white">Create account</h1>
          <p className="text-white/40 text-sm mt-1">Free for SDRs. No credit card required.</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl",
              headerTitle: "text-white text-lg",
              headerSubtitle: "text-white/40",
              socialButtonsBlockButton: "bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl py-3",
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-white/40",
              formFieldLabel: "text-white/60",
              formFieldInput: "bg-white/5 border-white/10 text-white rounded-xl",
              footerActionText: "text-white/40",
              footerActionLink: "text-linear-indigo",
              formButtonPrimary: "bg-linear-indigo hover:bg-linear-indigo/80 text-white rounded-xl",
            },
          }}
          signInUrl="/sign-in"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  );
}
