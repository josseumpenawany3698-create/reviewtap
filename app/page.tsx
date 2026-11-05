"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabase =
    supabaseUrl && supabaseKey
      ? createClient(supabaseUrl, supabaseKey)
      : null;

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLoggedIn(true);
        setAdminEmail(data.session.user.email || "");
      }
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session);
        setAdminEmail(session?.user.email || "");
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Konfigurasi Supabase belum tersedia.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Login gagal. Periksa email dan password.");
    }

    setLoading(false);
  }

  async function handleLogout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setLoggedIn(false);
    setAdminEmail("");
  }

  return (
    <main className="container">
      <div className="login-wrapper">
        <div className="brand">
          <div className="brand-logo">R</div>
          <h1>REVIEWTAP</h1>
          <p>Smart Review Management System</p>
        </div>

        {!loggedIn ? (
          <div className="login-card">
            <h2>Admin Login</h2>
            <p className="muted">
              Masuk untuk mengelola produk dan pelanggan.
            </p>

            <form onSubmit={handleLogin}>
              <label>Email Admin</label>
              <input
                type="email"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {message && (
                <p className="error-message">{message}</p>
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
              </button>
            </form>
          </div>
        ) : (
          <div className="login-card">
            <h2>Selamat datang!</h2>
            <p className="muted">
              Login berhasil sebagai {adminEmail}
            </p>

            <div className="dashboard-placeholder">
              <h3>REVIEWTAP Admin</h3>
              <p>Dashboard akan segera dilengkapi.</p>
            </div>

            <button onClick={handleLogout}>Keluar</button>
          </div>
        )}

        <footer>
          © 2026 REVIEWTAP. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
