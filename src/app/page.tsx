"use client";

import Link from "next/link";
import { ShoppingCart, BarChart3, Package, Users, Zap, Shield, Globe, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PhidPOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg shadow-sm">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptLTMwIDMwdjZINFYzNGg2em0wLTMwdjZINFY0aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" />
                Multi-Tenant Retail POS System
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Simplify Your<br />
                <span className="text-yellow-400">Retail Business</span><br />
                Management
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-lg">
                Professional POS system for wholesale and retail businesses. Manage sales, inventory, customers, and reports — all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl shadow-lg transition-all hover:shadow-yellow-400/30 hover:scale-105">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl border border-white/20 transition-all backdrop-blur-sm">
                  Sign In
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-blue-200 text-sm">
                {["No setup fee", "14-day free trial", "Cancel anytime"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" />{t}</span>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: ShoppingCart, label: "Daily Sales", value: "500+", color: "bg-blue-500" },
                { icon: Package, label: "Products", value: "10,000+", color: "bg-indigo-500" },
                { icon: Users, label: "Customers", value: "Multi-Store", color: "bg-purple-500" },
                { icon: BarChart3, label: "Reports", value: "Real-time", color: "bg-blue-600" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 flex flex-col gap-3">
                  <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-blue-200 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything You Need</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Powerful features designed for modern retail businesses</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShoppingCart, title: "Point of Sale", desc: "Fast, intuitive POS interface for quick transactions with receipt printing.", color: "text-blue-600 bg-blue-50" },
              { icon: Package, title: "Inventory Management", desc: "Track stock levels, set alerts, manage products across multiple stores.", color: "text-indigo-600 bg-indigo-50" },
              { icon: Users, title: "Customer Management", desc: "Manage customer accounts, debt tracking, and loyalty programs.", color: "text-purple-600 bg-purple-50" },
              { icon: BarChart3, title: "Reports & Analytics", desc: "Real-time sales reports, revenue charts, and business insights.", color: "text-green-600 bg-green-50" },
              { icon: Shield, title: "Multi-User Roles", desc: "Admin, cashier, manager roles with proper access controls.", color: "text-orange-600 bg-orange-50" },
              { icon: Globe, title: "Multi-Store Support", desc: "Manage multiple branches from a single dashboard.", color: "text-red-600 bg-red-50" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to grow your business?</h2>
          <p className="text-blue-100 mb-8">Join hundreds of retailers already using PhidPOS</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-3 rounded-xl shadow-lg transition-all">
              Start Free Trial
            </Link>
            <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3 rounded-xl border border-white/30 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">PhidPOS</span>
          </div>
          <p>© {new Date().getFullYear()} PhidPOS by Phidtech ICT & Business Solutions</p>
          <p>📞 Support: +255 682 188 544</p>
        </div>
      </footer>
    </div>
  );
}
