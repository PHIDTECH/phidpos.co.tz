"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Settings, Store, Users, Bell, Save, Loader2, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const TABS = ["general", "store", "users", "notifications"] as const;
type Tab = typeof TABS[number];

export default function SettingsPage() {
  const sessionData = useSession(); const session = sessionData?.data;
  const [tab, setTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({ businessName: "", currency: "TZS", timezone: "Africa/Dar_es_Salaam", taxRate: "18", phone: "", email: "", address: "" });
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "CASHIER" });
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => { loadSettings(); loadUsers(); }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) { const data = await res.json(); if (data.settings) setGeneral(prev => ({ ...prev, ...data.settings })); }
    } catch {}
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) { const data = await res.json(); setUsers(data.users || []); }
    } catch {}
  }

  async function saveGeneral() {
    setSaving(true);
    try {
      await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(general) });
      toast.success("Settings saved");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  async function createUser() {
    if (!userForm.name || !userForm.email || !userForm.password) { toast.error("Fill all required fields"); return; }
    setSavingUser(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("User created");
      setShowUserModal(false);
      setUserForm({ name: "", email: "", password: "", role: "CASHIER" });
      loadUsers();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setSavingUser(false);
  }

  const roleColors: Record<string, string> = {
    TENANT_ADMIN: "bg-red-100 text-red-700",
    STORE_MANAGER: "bg-blue-100 text-blue-700",
    CASHIER: "bg-green-100 text-green-700",
    ACCOUNTANT: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your business settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {tab === "general" && (
        <div className="bg-card border rounded-xl p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-lg">General Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Business Name", key: "businessName", type: "text", placeholder: "My Shop" },
              { label: "Phone", key: "phone", type: "tel", placeholder: "+255700000000" },
              { label: "Email", key: "email", type: "email", placeholder: "info@myshop.com" },
              { label: "Tax Rate (%)", key: "taxRate", type: "number", placeholder: "18" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium">{f.label}</label>
                <input type={f.type} value={(general as any)[f.key]}
                  onChange={e => setGeneral(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium">Currency</label>
              <select value={general.currency} onChange={e => setGeneral(prev => ({ ...prev, currency: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="UGX">UGX - Ugandan Shilling</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <select value={general.timezone} onChange={e => setGeneral(prev => ({ ...prev, timezone: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (UTC+3)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (UTC+3)</option>
                <option value="Africa/Kampala">Africa/Kampala (UTC+3)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Business Address</label>
              <textarea value={general.address} onChange={e => setGeneral(prev => ({ ...prev, address: e.target.value }))}
                rows={2} placeholder="Physical address"
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          </div>
          <button onClick={saveGeneral} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Team Members</h2>
            <button onClick={() => setShowUserModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.store?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="bg-card border rounded-xl p-6 max-w-2xl space-y-4">
          <h2 className="font-semibold text-lg">SMS Notifications</h2>
          <p className="text-sm text-muted-foreground">Configure when to send SMS alerts to customers and staff.</p>
          {[
            { label: "Low stock alerts", desc: "Notify manager when product stock falls below minimum level" },
            { label: "Debt reminders", desc: "Send reminder to customers with outstanding debt" },
            { label: "Sales receipt", desc: "Send receipt SMS to customers after purchase" },
            { label: "Payment confirmation", desc: "Notify customer when debt payment is recorded" },
          ].map((item, i) => (
            <div key={i} className="flex items-start justify-between py-3 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      )}

      {tab === "store" && (
        <div className="bg-card border rounded-xl p-6 max-w-2xl">
          <h2 className="font-semibold text-lg mb-4">Store Information</h2>
          <p className="text-sm text-muted-foreground">Store: <span className="font-medium text-foreground">{session?.user?.name}</span></p>
          <p className="text-xs text-muted-foreground mt-2">Contact your Tenant Admin to add or manage multiple stores.</p>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Add Team Member</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Email *", key: "email", type: "email", placeholder: "john@yourshop.com" },
                { label: "Password *", key: "password", type: "password", placeholder: "••••••••" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium">{f.label}</label>
                  <input type={f.type} value={(userForm as any)[f.key]}
                    onChange={e => setUserForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium">Role *</label>
                <select value={userForm.role} onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="CASHIER">Cashier</option>
                  <option value="STORE_MANAGER">Store Manager</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                </select>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowUserModal(false)} className="flex-1 py-2.5 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={createUser} disabled={savingUser} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                {savingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingUser ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
