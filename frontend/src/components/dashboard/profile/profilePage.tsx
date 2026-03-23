import { useAuth } from "../../../context/auth-context";
import { useState } from "react";
import { updateUser } from "../../../api/auth";
import { toast } from "sonner";
import {
  actionClass,
  bauhausFont,
  inputClass,
  panelClass,
  secondaryActionClass,
  sectionTitleClass,
} from "../dashboardTheme";

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return <div className={`mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 ${panelClass}`}>Loading profile...</div>;
  }

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const updated = await updateUser({ username, email });

      setUser({
        ...user,
        username: updated.username ?? user.username,
        email: updated.email ?? user.email,
      });

      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      setError(err.detail || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-2 py-3 sm:px-4 sm:py-6">
      <div className={`space-y-5 p-4 sm:space-y-6 sm:p-6 ${panelClass}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <p className={sectionTitleClass} style={bauhausFont}>
              Account
            </p>
            <h1
              className="mt-1.5 text-[1.7rem] font-black uppercase leading-none tracking-[0.1em] sm:mt-2 sm:text-[2.4rem] sm:tracking-[0.12em]"
              style={bauhausFont}
            >
              Profile
            </h1>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className={`w-full sm:w-auto ${secondaryActionClass}`}
              style={bauhausFont}
            >
              Edit
            </button>
          )}
        </div>

        <div className="grid gap-5 border-t-2 border-[#1a3a6b] pt-5 sm:gap-6 sm:pt-6 dark:border-[#f7b731]">
          <div>
            <p className={sectionTitleClass} style={bauhausFont}>
              Username
            </p>

            {editing ? (
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            ) : (
              <p className="mt-2 break-words text-[1.05rem] font-bold text-[#0a0a0a] sm:text-[1.35rem] dark:text-[#f5f0e8]">
                {user.username}
              </p>
            )}
          </div>

          <div>
            <p className={sectionTitleClass} style={bauhausFont}>
              Email
            </p>

            {editing ? (
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            ) : (
              <p className="mt-2 break-all text-[0.95rem] font-bold text-[#0a0a0a] sm:text-[1.1rem] dark:text-[#f5f0e8]">
                {user.email}
              </p>
            )}
          </div>

          {editing && (
            <div className="flex flex-col gap-3 pt-4">
              {error && (
                <p
                  className="text-sm font-bold uppercase tracking-[0.14em] text-[#d62828]"
                  style={bauhausFont}
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`w-full sm:w-auto ${actionClass}`}
                  style={bauhausFont}
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                  className={`w-full sm:w-auto ${secondaryActionClass}`}
                  style={bauhausFont}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
