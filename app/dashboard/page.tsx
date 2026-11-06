"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
const [signingOut, setSigningOut] = useState(false);
  const [stats, setStats] = useState({
  totalProducts: 0,
  activeProducts: 0,
  availableProducts: 0,
  totalClients: 0,
});

const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      router.replace("/");
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error || !data.session) {
        router.replace("/");
        return;
      }

      setEmail(data.session.user.email ?? "Admin");
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/");
      } else {
        setEmail(session.user.email ?? "Admin");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);
useEffect(() => {
  if (checking || !supabase) return;

  let cancelled = false;

  async function loadStats() {
    setStatsLoading(true);

    const [
      totalResult,
      activeResult,
      availableResult,
      clientsResult,
    ] = await Promise.all([
      supabase!.from("products").select("*", {
        count: "exact",
        head: true,
      }),
      supabase!.from("products").select("*", {
        count: "exact",
        head: true,
      }).eq("status", "active"),
      supabase!.from("products").select("*", {
        count: "exact",
        head: true,
      }).eq("status", "available"),
      supabase!.from("clients").select("*", {
        count: "exact",
        head: true,
      }),
    ]);

    if (cancelled) return;

    if (
      totalResult.error ||
      activeResult.error ||
      availableResult.error ||
      clientsResult.error
    ) {
      console.error("Gagal mengambil statistik:", {
        totalResult,
        activeResult,
        availableResult,
        clientsResult,
      });
    }

    setStats({
      totalProducts: totalResult.count ?? 0,
      activeProducts: activeResult.count ?? 0,
      availableProducts: availableResult.count ?? 0,
      totalClients: clientsResult.count ?? 0,
    });

    setStatsLoading(false);
  }

  loadStats();

  return () => {
    cancelled = true;
  };
}, [checking]);
  async function handleLogout() {
    if (!supabase) return;

    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Memuat REVIEWTAP...</p>

        <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 14px;
            background: #f7f8fc;
            color: #64748b;
            font-family: Arial, sans-serif;
          }
          .loader {
            width: 34px;
            height: 34px;
            border: 3px solid #e5e7eb;
            border-top-color: #5946e8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>REVIEWTAP</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="nav-label">MENU UTAMA</div>

      <nav className="navigation">
  <a className="nav-item active" href="/dashboard">
    <span>▦</span> Overview
  </a>

  <a className="nav-item" href="/dashboard/products">
    <span>▣</span> Manajemen Produk
  </a>

  <a className="nav-item" href="/dashboard/clients">
    <span>♙</span> Data Pelanggan
  </a>

  <a className="nav-item" href="/dashboard/history">
    <span>◷</span> Riwayat Aktivasi
  </a>
</nav>
        <div className="sidebar-bottom">
          <div className="admin-card">
            <div className="admin-avatar">A</div>
            <div className="admin-info">
              <strong>Administrator</strong>
              <span>Admin REVIEWTAP</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={signingOut}
          >
            <span>↪</span>
            {signingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / Overview</div>
            <h1>Dashboard</h1>
            <p>Selamat datang kembali di REVIEWTAP Admin.</p>
          </div>

          <div className="topbar-profile">
            <div className="online-dot" />
            <div className="profile-text">
              <strong>Administrator</strong>
              <span>{email}</span>
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <span className="welcome-label">REVIEWTAP MANAGEMENT</span>
            <h2>Kelola produk dan pelanggan dengan mudah.</h2>
            <p>
              Pantau seluruh aktivitas NFC dan QR Google Review dari satu
              dashboard.
            </p>
          </div>
          <div className="banner-symbol">R</div>
        </section>

        <section className="section-heading">
          <div>
            <h2>Ringkasan Bisnis</h2>
            <p>Ikhtisar data sistem REVIEWTAP.</p>
          </div>
          <span className="date-label">OVERVIEW</span>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total Produk</span>
              <div className="stat-icon purple">▣</div>
            </div>
            <h3>{statsLoading ? "..." : stats.totalProducts}</h3>
            <p>Data produk akan ditampilkan setelah integrasi.</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Produk Aktif</span>
              <div className="stat-icon green">✓</div>
            </div>
            <h3>{statsLoading ? "..." : stats.activeProducts}</h3>
            <p>Produk yang sudah terdaftar.</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Stok Tersedia</span>
              <div className="stat-icon orange">▤</div>
            </div>
            <h3>{statsLoading ? "..." : stats.availableProducts}</h3>
            <p>Produk yang belum diaktivasi.</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Total Pelanggan</span>
              <div className="stat-icon blue">♙</div>
            </div>
            <h3>{statsLoading ? "..." : stats.totalClients}</h3>
            <p>Bisnis yang sudah terdaftar.</p>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel" id="products">
            <div className="panel-heading">
              <div>
                <h2>Produk Terbaru</h2>
                <p>Daftar produk NFC dan QR REVIEWTAP.</p>
              </div>
              <span className="coming-soon">SEGERA</span>
            </div>

            <div className="empty-state">
              <div className="empty-icon">▣</div>
              <strong>Belum ada data produk</strong>
              <p>
                Data produk akan muncul di sini setelah fitur manajemen produk
                diaktifkan.
              </p>
            </div>
          </div>

          <div className="panel activity-panel" id="history">
            <div className="panel-heading">
              <div>
                <h2>Aktivitas Terbaru</h2>
                <p>Catatan aktivitas sistem.</p>
              </div>
            </div>

            <div className="empty-state">
              <div className="empty-icon">◷</div>
              <strong>Belum ada aktivitas</strong>
              <p>Riwayat aktivasi akan ditampilkan di sini.</p>
            </div>
          </div>
        </section>

        <section className="panel clients-panel" id="clients">
          <div className="panel-heading">
            <div>
              <h2>Data Pelanggan</h2>
              <p>Informasi bisnis yang menggunakan REVIEWTAP.</p>
            </div>
            <span className="coming-soon">SEGERA</span>
          </div>

          <div className="empty-state compact">
            <div className="empty-icon">♙</div>
            <strong>Belum ada data pelanggan</strong>
            <p>Data pelanggan akan muncul setelah fitur registrasi dibuat.</p>
          </div>
        </section>

        <footer className="footer">
          <span>© 2026 REVIEWTAP. All rights reserved.</span>
          <span>Smart Review Management System</span>
        </footer>
      </main>

      <style>{`
        * { box-sizing: border-box; }

        .dashboard {
          min-height: 100vh;
          display: flex;
          background: #f7f8fc;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
        }

        .sidebar {
          width: 260px;
          min-height: 100vh;
          background: #fff;
          border-right: 1px solid #e9ebf2;
          padding: 28px 18px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px 38px;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: #5946e8;
          color: white;
          display: grid;
          place-items: center;
          font-size: 24px;
          font-weight: 800;
        }

        .brand h2 {
          margin: 0 0 4px;
          font-size: 17px;
          letter-spacing: 1px;
        }

        .brand span {
          color: #9299aa;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        .nav-label {
          color: #a0a6b5;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.4px;
          padding: 0 12px 13px;
        }

        .navigation {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 14px;
          color: #737b8d;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          border-radius: 9px;
          transition: 0.2s;
        }

        .nav-item span {
          width: 20px;
          font-size: 18px;
          text-align: center;
        }

        .nav-item:hover, .nav-item.active {
          color: #5946e8;
          background: #f0eeff;
        }

        .sidebar-bottom { margin-top: auto; }

        .admin-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 8px;
          border-top: 1px solid #edf0f5;
        }

        .admin-avatar {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          background: #eeeaff;
          color: #5946e8;
          border-radius: 50%;
          font-weight: 700;
        }

        .admin-info { min-width: 0; }
        .admin-info strong, .admin-info span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-info strong { font-size: 12px; }
        .admin-info span { margin-top: 4px; color: #9299aa; font-size: 10px; }

        .logout-button {
          width: 100%;
          border: 1px solid #eceef4;
          background: white;
          color: #6e7585;
          border-radius: 9px;
          padding: 11px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }

        .logout-button span { margin: 0 10px 0 4px; }

        .main-content {
          width: calc(100% - 260px);
          max-width: 1600px;
          margin: 0 auto;
          padding: 34px 42px 22px;
          min-width: 0;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }

        .breadcrumb {
          color: #969daf;
          font-size: 11px;
          margin-bottom: 11px;
        }

        .topbar h1 { margin: 0; font-size: 28px; letter-spacing: -0.7px; }
        .topbar p { margin: 8px 0 0; color: #8a91a2; font-size: 13px; }

        .topbar-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #eceef4;
          border-radius: 12px;
          padding: 10px 14px;
          max-width: 300px;
        }

        .online-dot {
          width: 9px;
          height: 9px;
          background: #20b981;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .profile-text { min-width: 0; }
        .profile-text strong, .profile-text span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .profile-text strong { font-size: 11px; }
        .profile-text span { color: #9299aa; font-size: 10px; margin-top: 4px; }

        .welcome-banner {
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 180px;
          padding: 30px 34px;
          border-radius: 16px;
          background: linear-gradient(115deg, #5140d5, #7965f3);
          color: white;
          margin-bottom: 34px;
        }

        .welcome-label {
          font-size: 10px;
          letter-spacing: 1.8px;
          font-weight: 700;
          opacity: 0.75;
        }

        .welcome-banner h2 {
          max-width: 520px;
          font-size: 23px;
          line-height: 1.35;
          margin: 13px 0 9px;
        }

        .welcome-banner p {
          color: #e4e0ff;
          font-size: 12px;
          margin: 0;
          line-height: 1.6;
        }

        .banner-symbol {
          width: 125px;
          height: 125px;
          border-radius: 35px;
          display: grid;
          place-items: center;
          font-size: 72px;
          font-weight: 800;
          color: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
          transform: rotate(10deg);
          margin-right: 30px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 17px;
        }

        .section-heading h2, .panel-heading h2 {
          margin: 0;
          font-size: 16px;
        }

        .section-heading p, .panel-heading p {
          color: #9299aa;
          font-size: 11px;
          margin: 6px 0 0;
        }

        .date-label, .coming-soon {
          color: #8b80e9;
          background: #f0eeff;
          border-radius: 6px;
          padding: 7px 9px;
          font-size: 9px;
          letter-spacing: 0.8px;
          font-weight: 700;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card, .panel {
          background: white;
          border: 1px solid #eaecf2;
          border-radius: 13px;
        }

        .stat-card { padding: 20px; min-width: 0; }
        .stat-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .stat-top > span { color: #737b8d; font-size: 11px; font-weight: 600; }

        .stat-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          font-size: 17px;
        }

        .purple { color: #6855e9; background: #f0eeff; }
        .green { color: #1da879; background: #e9f8f2; }
        .orange { color: #e99a37; background: #fff5e8; }
        .blue { color: #3988d9; background: #eaf4ff; }

        .stat-card h3 { margin: 17px 0 7px; font-size: 27px; }
        .stat-card p { margin: 0; color: #a0a6b5; font-size: 10px; line-height: 1.5; }

        .content-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .panel { padding: 21px; min-width: 0; }
        .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }

        .empty-state {
          min-height: 190px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
        }

        .empty-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #f2f1ff;
          color: #7666e8;
          font-size: 21px;
          margin-bottom: 13px;
        }

        .empty-state strong { font-size: 12px; }
        .empty-state p {
          max-width: 260px;
          color: #9ba2b1;
          font-size: 10px;
          line-height: 1.6;
          margin: 7px 0 0;
        }

        .clients-panel { margin-bottom: 26px; }
        .empty-state.compact { min-height: 145px; }

        .footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #a0a6b5;
          font-size: 10px;
          padding: 8px 2px;
        }

        @media (max-width: 1100px) {
          .main-content { padding: 28px 24px; }
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 760px) {
          .sidebar { width: 70px; padding: 20px 9px; }
          .brand { justify-content: center; padding: 0 0 35px; }
          .brand > div:last-child, .nav-label, .nav-item:not(.active),
          .nav-item.active { font-size: 0; }
          .nav-item { justify-content: center; padding: 13px 5px; }
          .nav-item span { font-size: 19px; }
          .admin-card { justify-content: center; padding: 14px 0; }
          .admin-info { display: none; }
          .logout-button { font-size: 0; text-align: center; }
          .logout-button span { font-size: 17px; margin: 0; }
          .main-content { width: calc(100% - 70px); padding: 23px 15px; }
          .topbar { align-items: flex-start; flex-direction: column; }
          .topbar-profile { max-width: 100%; }
          .welcome-banner { padding: 25px 22px; }
          .welcome-banner h2 { font-size: 19px; }
          .banner-symbol { display: none; }
          .content-grid { grid-template-columns: 1fr; }
          .footer { flex-direction: column; }
        }

        @media (max-width: 430px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
