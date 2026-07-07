"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/lib/i18n";

const css = `
  .sa { padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .sa-header { margin-bottom: 24px; }
  .sa-title { font-size: 22px; font-weight: 800; color: #111; }
  .sa-sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .sa-badge { display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; margin-bottom: 12px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }
  .stat-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-val { font-size: 28px; font-weight: 800; color: #111; margin: 6px 0 4px; }
  .stat-sub { font-size: 12px; color: #9ca3af; }
  .stat-icon { font-size: 22px; float: right; margin-top: -32px; }
  .card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
  .card-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 0; border-bottom: 1px solid #f9fafb; color: #374151; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-yellow { background: #fef9c3; color: #854d0e; }
  .badge-red { background: #fee2e2; color: #b91c1c; }
  .spinner-wrap { display: flex; align-items: center; justify-content: center; height: 200px; }
  .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 900px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
`;

export default function SuperAdminDashboard() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const { t } = useLang();
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/superadmin/stats")
      .then(r => r.json())
      .then(d => { setStats(d.stats); setTenants(d.tenants || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const userName = session?.user?.name || "Super Admin";

  return (
    <>
      <style>{css}</style>
      <div className="sa">
        <div className="sa-header">
          <div className="sa-badge">⚡ Super Admin</div>
          <div className="sa-title">Karibu, {userName} 👋</div>
          <div className="sa-sub">Udhibiti wa Mfumo Wote — PhidPOS Platform</div>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <>
            <div className="stats-grid">
              {[
                { label: "Jumla ya Tenants", val: stats?.totalTenants || 0, sub: "Biashara zilizosajiliwa", icon: "🏢" },
                { label: "Tenants Hai", val: stats?.activeTenants || 0, sub: "Wanaotumia mfumo", icon: "✅" },
                { label: "Watumiaji Wote", val: stats?.totalUsers || 0, sub: "Akaunti zote", icon: "👥" },
                { label: "Mauzo Leo", val: stats?.todaySales || 0, sub: "Miamala ya leo", icon: "💰" },
              ].map((c, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-val">{c.val} <span className="stat-icon">{c.icon}</span></div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">🏢 Tenants Wote ({tenants.length})</div>
              <div style={{overflowX:"auto"}}>
                <table>
                  <thead>
                    <tr>
                      <th>Biashara</th>
                      <th>Barua Pepe</th>
                      <th>Mpango</th>
                      <th>Hali</th>
                      <th>Ilianzishwa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.length > 0 ? tenants.map((t: any) => (
                      <tr key={t.id}>
                        <td style={{fontWeight:600}}>{t.name}</td>
                        <td style={{color:"#6b7280",fontSize:"12px"}}>{t.email}</td>
                        <td>{t.plan?.name || "—"}</td>
                        <td>
                          <span className={`badge ${t.status === "ACTIVE" ? "badge-green" : t.status === "TRIAL" ? "badge-yellow" : "badge-red"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{color:"#9ca3af",fontSize:"12px"}}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} style={{padding:"24px",textAlign:"center",color:"#9ca3af"}}>Hakuna tenants bado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
