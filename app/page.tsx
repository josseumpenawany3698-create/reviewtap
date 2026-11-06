"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Product = {
  id: string;
  code: string;
  product_type: string;
  status: string;
  created_at: string;
};

type Client = {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
};

const menuItems = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "products", label: "Produk", icon: "▣" },
  { id: "customers", label: "Pelanggan", icon: "♙" },
  { id: "registrations", label: "Registrasi", icon: "▤" },
  { id: "history", label: "Riwayat Aktivasi", icon: "◷" },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [activeMenu, setActiveMenu] = useState("overview");

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [availableProducts, setAvailableProducts] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
const [newProductType, setNewProductType] = useState<"NFC" | "QR">("NFC");
const [newProductQuantity, setNewProductQuantity] = useState("1");
const [savingProducts, setSavingProducts] = useState(false);
const [productMessage, setProductMessage] = useState("");
  const [dataError, setDataError] = useState("");

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    return url && key ? createClient(url, key) : null;
  }, []);
async function handleAddProducts() {
  if (!supabase) return;

  const quantity = Number(newProductQuantity);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    setProductMessage("Jumlah produk harus 1 sampai 500.");
    return;
  }

  setSavingProducts(true);
  setProductMessage("");

  const { data: existingProducts, error: fetchError } =
    await supabase.from("products").select("code");

  if (fetchError) {
    setProductMessage("Gagal membaca stok produk.");
    setSavingProducts(false);
    return;
  }

  const highestNumber = (existingProducts || []).reduce(
    (max, product) => {
      const match = product.code.match(/^\/?(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    },
    0
  );

  const newProducts = Array.from({ length: quantity }, (_, index) => ({
    code: `/${String(highestNumber + index + 1).padStart(3, "0")}`,
    product_type: newProductType,
    status: "available",
  }));

  const { error } = await supabase.from("products").insert(newProducts);

  if (error) {
    setProductMessage("Gagal menambahkan produk. Periksa kembali database.");
    setSavingProducts(false);
    return;
  }

  setProductMessage(`${quantity} produk berhasil ditambahkan.`);
  setNewProductQuantity("1");
  setShowAddProduct(false);
  setSavingProducts(false);

  window.location.reload();
}
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
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !loggedIn) return;

    async function loadDashboard() {
      if (!supabase) return;

      setDataLoading(true);
      setDataError("");

      const [
        productCount,
        clientCount,
        activeCount,
        availableCount,
        productList,
        clientList,
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("status", "available"),
        supabase
          .from("products")
          .select("id, code, product_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("clients")
          .select("id, business_name, contact_name, contact_phone, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (
        productCount.error ||
        clientCount.error ||
        activeCount.error ||
        availableCount.error ||
        productList.error ||
        clientList.error
      ) {
        setDataError("Gagal memuat data. Periksa kebijakan akses database.");
      } else {
        setTotalProducts(productCount.count || 0);
        setTotalClients(clientCount.count || 0);
        setActiveProducts(activeCount.count || 0);
        setAvailableProducts(availableCount.count || 0);
        setProducts(productList.data || []);
        setClients(clientList.data || []);
      }

      setDataLoading(false);
    }

    loadDashboard();
  }, [supabase, loggedIn]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
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

  if (!loggedIn) {
    return (
      <main className="login-page">
        <div className="login-brand">
          <div className="brand-logo">R</div>
          <h1>REVIEWTAP</h1>
          <p>Smart Review Management System</p>
        </div>

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

            {message && <p className="error-message">{message}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>
          </form>
        </div>

        <footer className="login-footer">
          © 2026 REVIEWTAP. All rights reserved.
        </footer>

        <style jsx>{`
          .login-page {
            min-height: 100vh;
            background: #f5f6fa;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px 20px;
          }
          .login-brand {
            text-align: center;
            margin-bottom: 35px;
          }
          .brand-logo {
            width: 65px;
            height: 65px;
            border-radius: 18px;
            background: #5846e8;
            color: white;
            display: grid;
            place-items: center;
            font-size: 32px;
            font-weight: 800;
            margin: auto;
          }
          .login-brand h1 {
            letter-spacing: 4px;
            margin: 15px 0 5px;
          }
          .login-brand p,
          .muted {
            color: #778094;
          }
          .login-card {
            background: white;
            border: 1px solid #e5e7ef;
            border-radius: 22px;
            padding: 38px;
            width: 100%;
            max-width: 480px;
          }
          .login-card h2 {
            margin-top: 0;
          }
          label {
            display: block;
            margin: 20px 0 8px;
            font-weight: 600;
          }
          input {
            width: 100%;
            padding: 14px;
            border: 1px solid #dfe2eb;
            border-radius: 10px;
            font-size: 15px;
            box-sizing: border-box;
          }
          button {
            width: 100%;
            padding: 15px;
            margin-top: 25px;
            background: #5846e8;
            color: white;
            border: 0;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }
          .error-message {
            color: #dc2626;
          }
          .login-footer {
            margin-top: 35px;
            color: #778094;
          }
        `}</style>
      </main>
    );
  }

  const pageTitle =
    menuItems.find((item) => item.id === activeMenu)?.label || "Overview";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">R</div>
          <div>
            <strong>REVIEWTAP</strong>
            <small>ADMIN SYSTEM</small>
          </div>
        </div>

        <div className="menu-label">MENU UTAMA</div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${activeMenu === item.id ? "selected" : ""}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-info">
            <div className="admin-avatar">A</div>
            <div className="admin-text">
              <strong>Administrator</strong>
              <small>{adminEmail}</small>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            ↪ Keluar
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-label">REVIEWTAP / ADMIN</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-right">
            <span className="online-dot"></span>
            Sistem Online
          </div>
        </header>

        <div className="content">
          {dataError && <div className="error-box">{dataError}</div>}

          {dataLoading && (
            <p className="loading-text">Memuat data REVIEWTAP...</p>
          )}

          {activeMenu === "overview" && (
            <>
              <div className="welcome-section">
                <div>
                  <h2>Selamat datang di REVIEWTAP</h2>
                  <p>Kelola produk, pelanggan, dan aktivasi kartu Anda.</p>
                </div>
                <div className="date-label">
                  SMART REVIEW MANAGEMENT
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">▣</div>
                  <p>Total Produk</p>
                  <h2>{totalProducts}</h2>
                  <small>Seluruh kartu terdaftar</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">✓</div>
                  <p>Produk Aktif</p>
                  <h2>{activeProducts}</h2>
                  <small>Kartu sudah diaktivasi</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">▤</div>
                  <p>Stok Tersedia</p>
                  <h2>{availableProducts}</h2>
                  <small>Siap untuk dijual</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">♙</div>
                  <p>Total Pelanggan</p>
                  <h2>{totalClients}</h2>
                  <small>Bisnis terdaftar</small>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h3>Produk Terbaru</h3>
                  <p>Daftar produk yang terakhir dimasukkan.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setActiveMenu("products")}
                >
                  Lihat semua →
                </button>
              </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
  <button
    onClick={() => {
      setShowAddProduct(!showAddProduct);
      setProductMessage("");
    }}
    style={{
      background: "#5b45ed",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "13px 22px",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    + Tambah Produk
  </button>
</div>

{showAddProduct && (
  <div className="table-card" style={{ padding: "24px", marginBottom: "20px" }}>
    <h3>Tambah Stok Produk</h3>
    <p className="muted">Masukkan jenis dan jumlah kartu yang ingin ditambahkan.</p>

    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleAddProducts();
      }}
    >
      <label>Jenis Produk</label>
      <select
        value={newProductType}
        onChange={(e) => setNewProductType(e.target.value as "NFC" | "QR")}
      >
        <option value="NFC">NFC</option>
        <option value="QR">QR Code</option>
      </select>

      <label>Jumlah Produk</label>
      <input
        type="number"
        min="1"
        max="500"
        value={newProductQuantity}
        onChange={(e) => setNewProductQuantity(e.target.value)}
        required
      />

      {productMessage && <p>{productMessage}</p>}

      <button type="submit" disabled={savingProducts}>
        {savingProducts ? "Menyimpan..." : "Simpan Stok"}
      </button>
    </form>
  </div>
)}
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Kode Produk</th>
                      <th>Jenis</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty-state">
                          Belum ada produk. Tambahkan stok produk pertama Anda.
                        </td>
                      </tr>
                    ) : (
                      products.slice(0, 5).map((product) => (
                        <tr key={product.id}>
                          <td>
                            <strong>/{product.code}</strong>
                          </td>
                          <td>{product.product_type}</td>
                          <td>
                            <span className={`status ${product.status}`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeMenu === "products" && (
            <>
              <div className="section-heading">
                <div>
                  <h3>Manajemen Produk</h3>
                  <p>Daftar seluruh kartu NFC dan QR REVIEWTAP.</p>
                </div>
              </div>
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Jenis Produk</th>
                      <th>Status</th>
                      <th>Tanggal Dibuat</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          Belum ada produk di database.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id}>
                          <td><strong>/{product.code}</strong></td>
                          <td>{product.product_type}</td>
                          <td>
                            <span className={`status ${product.status}`}>
                              {product.status}
                            </span>
                          </td>
                          <td>
                            {new Date(product.created_at).toLocaleDateString("id-ID")}
                          </td>
                          <td>
  <button
    type="button"
    onClick={async () => {
      if (!supabase) return;

      const confirmed = window.confirm(
        `Nonaktifkan produk ${product.code}?`
      );

      if (!confirmed) return;

      const { error } = await supabase
        .from("products")
        .update({ status: "inactive" })
        .eq("id", product.id);

      if (error) {
        alert("Gagal menonaktifkan produk.");
        return;
      }

      window.location.reload();
    }}
    disabled={product.status === "inactive"}
  >
    {product.status === "inactive" ? "Nonaktif" : "Nonaktifkan"}
  </button>
</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeMenu === "customers" && (
            <>
              <div className="section-heading">
                <div>
                  <h3>Data Pelanggan</h3>
                  <p>Bisnis yang sudah terdaftar di REVIEWTAP.</p>
                </div>
              </div>
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Nama Bisnis</th>
                      <th>Nama Kontak</th>
                      <th>Nomor Telepon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty-state">
                          Belum ada pelanggan terdaftar.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr key={client.id}>
                          <td><strong>{client.business_name}</strong></td>
                          <td>{client.contact_name || "-"}</td>
                          <td>{client.contact_phone || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeMenu === "registrations" && (
            <div className="coming-card">
              <div className="coming-icon">▤</div>
              <h2>Registrasi Produk</h2>
              <p>
                Modul untuk menghubungkan kode kartu dengan data pelanggan
                dan Google Review akan dibangun pada tahap berikutnya.
              </p>
            </div>
          )}

          {activeMenu === "history" && (
            <>
              <div className="section-heading">
                <div>
                  <h3>Riwayat Aktivasi</h3>
                  <p>Catatan registrasi dan perubahan produk.</p>
                </div>
              </div>
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Informasi</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={2} className="empty-state">
                        Riwayat aktivasi akan ditampilkan setelah modul
                        registrasi selesai dibuat.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          background: #f5f6fa;
          color: #202333;
          font-family: Arial, sans-serif;
        }
        .sidebar {
          width: 255px;
          min-height: 100vh;
          background: #fff;
          border-right: 1px solid #e8eaf0;
          padding: 25px 17px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 5px 8px 35px;
        }
        .sidebar-logo {
          width: 42px;
          height: 42px;
          background: #5846e8;
          color: white;
          display: grid;
          place-items: center;
          border-radius: 12px;
          font-size: 23px;
          font-weight: 800;
        }
        .sidebar-brand strong {
          display: block;
          letter-spacing: 2px;
          font-size: 16px;
        }
        .sidebar-brand small {
          color: #9298a8;
          font-size: 9px;
          letter-spacing: 1px;
        }
        .menu-label {
          color: #a0a5b3;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          padding: 0 12px 13px;
        }
        nav {
          display: grid;
          gap: 7px;
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 13px;
          width: 100%;
          padding: 13px 14px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #697084;
          text-align: left;
          font-size: 14px;
          cursor: pointer;
        }
        .menu-item span {
          width: 20px;
          font-size: 18px;
          text-align: center;
        }
        .menu-item.selected {
          background: #efedff;
          color: #5846e8;
          font-weight: 700;
        }
        .sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid #eceef3;
          padding-top: 18px;
        }
        .admin-info {
          display: flex;
          gap: 10px;
          align-items: center;
          min-width: 0;
        }
        .admin-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #e9e7ff;
          color: #5846e8;
          font-weight: 700;
        }
        .admin-text {
          min-width: 0;
        }
        .admin-text strong,
        .admin-text small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-text strong {
          font-size: 12px;
        }
        .admin-text small {
          color: #8b91a0;
          font-size: 10px;
          margin-top: 4px;
        }
        .logout-button {
          width: 100%;
          margin-top: 15px;
          padding: 11px;
          background: #fff3f3;
          color: #d34c4c;
          border: 0;
          border-radius: 9px;
          cursor: pointer;
        }
        .main-area {
          flex: 1;
          min-width: 0;
        }
        .topbar {
          height: 90px;
          padding: 0 35px;
          background: white;
          border-bottom: 1px solid #e8eaf0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .topbar-label {
          font-size: 10px;
          color: #9298a8;
          letter-spacing: 1px;
        }
        .topbar h1 {
          font-size: 22px;
          margin: 6px 0 0;
        }
        .topbar-right {
          color: #737b8c;
          font-size: 12px;
        }
        .online-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #20b77a;
          border-radius: 50%;
          margin-right: 7px;
        }
        .content {
          padding: 32px 35px;
          max-width: 1400px;
          margin: auto;
        }
        .welcome-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .welcome-section h2 {
          font-size: 21px;
          margin: 0 0 8px;
        }
        .welcome-section p,
        .section-heading p {
          color: #858b9b;
          font-size: 13px;
          margin: 0;
        }
        .date-label {
          color: #8c91a0;
          font-size: 10px;
          letter-spacing: 1.3px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
        }
        .stat-card {
          background: white;
          border: 1px solid #e9eaf0;
          border-radius: 15px;
          padding: 21px;
        }
        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          font-size: 18px;
        }
        .purple { background: #efedff; color: #5846e8; }
        .green { background: #e5f8ef; color: #159c62; }
        .orange { background: #fff2e3; color: #e28a29; }
        .blue { background: #e7f2ff; color: #3986d8; }
        .stat-card p {
          color: #818799;
          font-size: 12px;
          margin: 17px 0 5px;
        }
        .stat-card h2 {
          font-size: 29px;
          margin: 0 0 5px;
        }
        .stat-card small {
          color: #a0a5b1;
          font-size: 10px;
        }
        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 32px 0 15px;
        }
        .section-heading h3 {
          margin: 0 0 6px;
          font-size: 16px;
        }
        .text-button {
          border: 0;
          background: transparent;
          color: #5846e8;
          font-weight: 700;
          cursor: pointer;
        }
        .table-card {
          background: white;
          border: 1px solid #e8eaf0;
          border-radius: 14px;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        th {
          color: #858b9b;
          font-weight: 600;
          background: #fafbfc;
        }
        th, td {
          padding: 16px 20px;
          border-bottom: 1px solid #eff0f4;
          white-space: nowrap;
        }
        tr:last-child td {
          border-bottom: 0;
        }
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 11px;
          background: #f0f1f5;
          color: #697084;
        }
        .status.active {
          background: #e4f8ed;
          color: #159c62;
        }
        .status.available {
          background: #e9f2ff;
          color: #347ac5;
        }
        .status.inactive {
          background: #fff0ed;
          color: #d65b48;
        }
        .empty-state {
          text-align: center;
          color: #969baa;
          padding: 35px;
        }
        .coming-card {
          background: white;
          border: 1px solid #e8eaf0;
          border-radius: 16px;
          padding: 45px;
          text-align: center;
          max-width: 650px;
          margin: 35px auto;
        }
        .coming-icon {
          font-size: 35px;
          color: #5846e8;
        }
        .coming-card p {
          color: #858b9b;
          line-height: 1.7;
        }
        .loading-text {
          color: #777f91;
        }
        .error-box {
          background: #fff0ed;
          color: #b74436;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) {
          .sidebar { width: 210px; }
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .content { padding: 25px 20px; }
          .topbar { padding: 0 20px; }
        }
        @media (max-width: 600px) {
          .app-shell { display: block; }
          .sidebar { width: 100%; min-height: auto; padding: 14px; }
          .sidebar-brand { padding-bottom: 15px; }
          .sidebar-bottom { display: none; }
          nav { display: flex; overflow-x: auto; }
          .menu-item { width: auto; white-space: nowrap; }
          .menu-label { display: none; }
          .topbar { height: 75px; }
          .topbar h1 { font-size: 18px; }
          .topbar-right { display: none; }
          .stats-grid { gap: 10px; }
          .stat-card { padding: 14px; }
          .welcome-section { display: block; }
          .date-label { margin-top: 12px; }
        }
      `}</style>
    </main>
  );
}
