import { useAuth } from "../../../context/auth-context";
import { useState } from "react";
import { updateUser } from "../../../api/auth-funcs";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return <div className="p-8 text-gray-500">Loading profile...</div>;
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
        setError(err.detail || "Something went wrong")
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Profile</h1>

        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-800 border border-gray-200 rounded-xl p-6 space-y-6">
        {/* Username */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-300">Username</p>

          {editing ? (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-neutral-700"
            />
          ) : (
            <p className="text-lg font-medium">{user.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-300">Email</p>

          {editing ? (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-neutral-700"
            />
          ) : (
            <p className="text-lg font-medium">{user.email}</p>
          )}
        </div>

        {/* User ID
        // <div>
        //   <p className="text-sm text-gray-500 dark:text-gray-300">User ID</p>
        //   <p className="text-lg font-medium">{user.id}</p>
        // </div> */}

        {editing && (
          <div className="flex flex-col gap-3 pt-4">
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-black text-white rounded-md"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
