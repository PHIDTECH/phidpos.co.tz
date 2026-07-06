"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { CreditCard, Check, Zap, Star, Building2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

const PLANS = [
  {
    id: "FREE",
    name: "Free Trial",
    price: 0,
    period: "forever",
    color: "border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    icon: Zap,
    features: ["1 Store", "Up to 100 products", "Basic reports", "1 user", "No SMS"],
  },
  {
    id: "BASIC",
    name: "Basic",
    price: 29000,
    period: "month",
    color: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    icon: Star,
    features: ["1 Store", "Unlimited products", "Full reports", "3 users", "100 SMS/month", "Offline POS"],
  },
  {
    id: "PRO",
    name: "Professional",
    price: 79000,
    period: "month",
    color: "border-purple-200 ring-2 ring-purple-400",
    badge: "bg-purple-100 text-purple-700",
    icon: Building2,
    popular: true,
    features: ["3 Stores", "Unlimited products", "Advanced analytics", "10 users", "500 SMS/month", "Offline POS", "Priority support"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 199000,
    period: "month",
    color: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    icon: Building2,
    features: ["Unlimited stores", "Unlimited products", "Custom reports", "Unlimited users", "2000 SMS/month", "Dedicated support", "Custom integrations"],
  },
];

export default function SubscriptionPage() {
  const sessionData = useSession(); const session = sessionData?.data;
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => { loadSubscription(); }, []);

  async function loadSubscription() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) { const data = await res.json(); setSubscription(data.subscription); }
    } catch {}
    setLoading(false);
  }

  async function selectPlan(planId: string) {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Switched to ${planId} plan`);
      loadSubscription();
    } catch { toast.error("Failed to update plan. Contact support."); }
    setUpgrading(null);
  }

  const currentPlan = subscription?.plan || "FREE";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription & Plans</h1>
        <p className="text-muted-foreground text-sm">Manage your subscription plan</p>
      </div>

      {/* Current Plan Status */}
      {!loading && subscription && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Plan</p>
              <h2 className="text-3xl font-bold mt-1">{PLANS.find(p => p.id === currentPlan)?.name || currentPlan}</h2>
              {subscription.expiresAt && (
                <p className="text-blue-100 text-sm mt-2">Expires: {formatDate(subscription.expiresAt)}</p>
              )}
              <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                subscription.status === "ACTIVE" ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${subscription.status === "ACTIVE" ? "bg-green-300" : "bg-red-300"}`} />
                {subscription.status}
              </div>
            </div>
            <CreditCard className="w-12 h-12 text-blue-300" />
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <div key={plan.id} className={`relative bg-card border-2 rounded-2xl p-5 flex flex-col ${plan.color}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.badge}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">{plan.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.badge}`}>{plan.id}</span>
                </div>
              </div>

              <div className="mb-4">
                {plan.price === 0 ? (
                  <p className="text-3xl font-bold">Free</p>
                ) : (
                  <div>
                    <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground"> TZS/{plan.period}</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && selectPlan(plan.id)}
                disabled={isCurrent || upgrading === plan.id}
                className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  isCurrent
                    ? "bg-green-100 text-green-700 cursor-default"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {upgrading === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCurrent ? "✓ Current Plan" : upgrading === plan.id ? "Switching…" : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Billing Info */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Billing Information</h3>
        <p className="text-sm text-muted-foreground">
          For billing inquiries, plan upgrades, or payment issues, please contact our support team at{" "}
          <a href="mailto:billing@phidpos.co.tz" className="text-blue-600 underline">billing@phidpos.co.tz</a>{" "}
          or call <span className="font-medium text-foreground">+255 XXX XXX XXX</span>.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Payments are accepted via M-Pesa, Tigo Pesa, Airtel Money, and bank transfer.
        </p>
      </div>
    </div>
  );
}
