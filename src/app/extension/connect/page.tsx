import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/get-user";
import ConnectClient from "./connect-client";
import Nav from "@/components/nav";

export const metadata = {
  title: "Connect Extension — Gauge",
  description: "Connect your Gauge account with the Gauge Chrome Extension.",
};

export default async function ExtensionConnectPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/extension/connect");
  }

  const user = await getUserByClerkId(userId);
  const plan = (user.plan || "free").toLowerCase();

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#090a0f] text-white flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <ConnectClient user={{ id: user.id, email: user.email, name: user.name, plan }} />
        </div>
      </main>
    </>
  );
}
