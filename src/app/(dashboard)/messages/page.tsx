"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function TenantMessagesPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/messages/send"); }, []);
  return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Inaelekeza…</div>;
}
