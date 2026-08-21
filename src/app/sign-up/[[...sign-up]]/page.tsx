"use client";

import { SignUp, SignOutButton, useAuth } from "@clerk/nextjs";

function PulseSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse"
      aria-hidden="true"
      aria-label="Loading sign up form"
    >
      <div className="h-10 bg-gray-100 rounded-full" />
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-100" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="h-4 w-20 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded-xl" />
      <div className="h-4 w-16 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded-xl" />
      <div className="h-10 bg-[#F26522]/30 rounded-full" />
      <div className="text-center">
        <div className="h-4 w-48 bg-gray-100 rounded inline-block" />
      </div>
    </div>
  );
}

function AlreadySignedInCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-amber-700 text-[16px]" aria-hidden="true">
          •
        </span>
      </div>
      <h2 className="text-[15px] font-semibold tracking-tight text-gray-900">You are already signed in</h2>
      <p className="text-[13px] text-gray-500 mt-1">
        To create a different account, sign out first.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <SignOutButton>
          <button
            type="button"
            className="w-full bg-[#F26522] hover:bg-[#e05a1a] text-white rounded-full text-[13px] font-medium h-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26522] focus-visible:ring-offset-2"
          >
            Switch account — Sign out
          </button>
        </SignOutButton>
        <a
          href="/app"
          className="w-full inline-flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-[13px] font-medium rounded-full h-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          Go to app
        </a>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main id="main" className="min-h-screen bg-[#EFEFEF] flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-[11px] font-bold tracking-tight">G</span>
            </div>
            <h1 className="text-[20px] font-semibold tracking-tight text-gray-900">Create your account</h1>
            <p className="text-[13px] text-gray-500 mt-1">Start your free trial — no credit card needed</p>
          </div>
          <PulseSkeleton />
        </div>
      </main>
    );
  }

  if (isSignedIn) {
    return (
      <main id="main" className="min-h-screen bg-[#EFEFEF] flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-[11px] font-bold tracking-tight">G</span>
            </div>
            <h1 className="text-[20px] font-semibold tracking-tight text-gray-900">Create your account</h1>
            <p className="text-[13px] text-gray-500 mt-1">Start your free trial — no credit card needed</p>
          </div>
          <AlreadySignedInCard />
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen bg-[#EFEFEF] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-[11px] font-bold tracking-tight">G</span>
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight text-gray-900">Create your account</h1>
          <p className="text-[13px] text-gray-500 mt-1">Start your free trial — no credit card needed</p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          fallbackRedirectUrl="/app"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none bg-white rounded-2xl border border-gray-200 p-6",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-[13px] font-medium rounded-full h-10",
              socialButtonsBlockButtonText: "text-gray-900",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-400 text-[11px]",
              formFieldLabel: "text-gray-700 text-[12px] font-medium",
              formFieldInput:
                "bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 h-10 px-4 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]",
              formButtonPrimary:
                "bg-[#F26522] hover:bg-[#e05a1a] text-white rounded-full text-[13px] font-medium h-10",
              footerActionLink: "text-[#F26522] hover:text-[#e05a1a] text-[12px]",
              footerActionText: "text-gray-500 text-[12px]",
            },
          }}
        />
      </div>
    </main>
  );
}
