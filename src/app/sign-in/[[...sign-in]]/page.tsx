import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-10 h-10 bg-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-[10px] tracking-tight">AX</span>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to Axion Studio</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white border border-gray-200 shadow-lg rounded-2xl",
              headerTitle: "text-gray-900 text-lg",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-3",
              socialButtonsBlockButtonText: "text-gray-700 font-medium",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-400",
              formFieldLabel: "text-gray-600",
              formFieldInput: "bg-white border-gray-200 text-gray-900 rounded-xl",
              footerActionText: "text-gray-400",
              footerActionLink: "text-[#F26522]",
              formButtonPrimary: "bg-gray-900 hover:bg-gray-800 text-white rounded-xl",
            },
          }}
          signUpUrl="/sign-up"
          afterSignInUrl="/app"
        />
      </div>
    </div>
  );
}
