"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Nav from "@/components/nav";
import { User, Bell, Moon, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifs, weeklyDigest, darkMode }),
      });
      if (res.ok) {
        toast.success("Preferences saved");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
          <p className="text-white/40 text-sm mt-1">Manage your account preferences</p>
        </div>

        <div className="space-y-6">
          <Section icon={<User className="w-4 h-4" />} title="Profile">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Name</label>
                <p className="text-white/80 text-sm">{user?.fullName || "Not set"}</p>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Email</label>
                <p className="text-white/80 text-sm">{user?.primaryEmailAddress?.toString() || "Not set"}</p>
              </div>
            </div>
          </Section>

          <Section icon={<Bell className="w-4 h-4" />} title="Notifications">
            <div className="space-y-5">
              <Toggle
                label="Email notifications"
                description="Receive email updates about shared calls and mentions"
                checked={emailNotifs}
                onChange={setEmailNotifs}
              />
              <Toggle
                label="Weekly digest"
                description="Get a weekly summary of call activity and action items"
                checked={weeklyDigest}
                onChange={setWeeklyDigest}
              />
            </div>
          </Section>

          <Section icon={<Moon className="w-4 h-4" />} title="Theme">
            <Toggle
              label="Dark mode"
              description="Use dark theme across the app"
              checked={darkMode}
              onChange={setDarkMode}
            />
          </Section>

          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#F26522] rounded-full text-xs font-semibold hover:bg-[#F26522]/90 transition disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving..." : "Save preferences"}
            </button>
          </div>

          <Section icon={<ShieldAlert className="w-4 h-4" />} title="Account">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-5 py-2.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition"
              >
                Delete account
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400 leading-relaxed">
                    This action is permanent and cannot be undone. All your data, including calls, analytics, and team associations, will be deleted.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        const res = await fetch("/api/user/delete", { method: "DELETE" });
                        if (res.ok) {
                          toast.success("Account deleted");
                          router.push("/sign-in");
                        } else {
                          toast.error("Failed to delete account");
                        }
                      } catch {
                        toast.error("Failed to delete account");
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {deleting ? "Deleting..." : "Yes, delete my account"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-5 py-2.5 text-xs font-medium text-white/60 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#F26522]">{icon}</span>
        <h2 className="text-sm font-medium text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-white/80">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked ? "bg-[#F26522]" : "bg-white/10"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
