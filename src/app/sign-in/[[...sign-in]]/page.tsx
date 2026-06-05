import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#EFEFEF] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-[11px] font-bold tracking-tight">CP</span>
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight text-gray-900">Welcome back</h1>
          <p className="text-[13px] text-gray-500 mt-1">Sign in to CallNote Pro</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none bg-white rounded-2xl border border-gray-200 p-6",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-[13px] font-medium rounded-full h-10",
              socialButtonsBlockButtonText: "text-gray-900",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-400 text-[11px]",
              formFieldLabel: "text-gray-700 text-[12px] font-medium",
              formFieldInput: "bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 h-10 px-4 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]",
              formButtonPrimary: "bg-[#F26522] hover:bg-[#e05a1a] text-white rounded-full text-[13px] font-medium h-10",
              footerActionLink: "text-[#F26522] hover:text-[#e05a1a] text-[12px]",
              footerActionText: "text-gray-500 text-[12px]",
              identityPreviewText: "text-gray-600 text-[12px]",
              identityPreviewEditButton: "text-[#F26522] text-[12px]",
            },
          }}
        />
      </div>
    </main>
  );
}
