
"use client";

import { useEffect, useState, type FormEvent, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Product = {
  id: string;
  code: string;
  product_type: "NFC" | "QR";
  status: "available" | "active" | "inactive";
  created_at: string;
};

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"NFC" | "QR">("NFC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<Product | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editType, setEditType] = useState<"NFC" | "QR">("NFC");
  const [editStatus, setEditStatus] = useState<
    "available" | "active" | "inactive"
  >("available");

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Gagal mengambil data produk: " + error.message);
    } else {
      setProducts((data || []) as Product[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!data.session) {
        router.replace("/");
        return;
      }

      const { data: productData, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setMessage("Gagal mengambil data produk: " + error.message);
      } else {
        setProducts((productData || []) as Product[]);
      }

      setLoading(false);
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleAddProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const cleanCode = code.trim();

    if (!cleanCode) {
      setMessage("Masukkan kode produk terlebih dahulu.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("products").insert({
      code: cleanCode,
      product_type: type,
      status: "available",
    });

    if (error) {
      setMessage(
        error.code === "23505"
          ? "Kode produk sudah digunakan. Gunakan kode lain."
          : "Gagal menambahkan produk: " + error.message
      );
    } else {
      setCode("");
      setType("NFC");
      setMessage("Produk berhasil ditambahkan!");
      await loadProducts();
    }

    setSaving(false);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setEditCode(product.code);
    setEditType(product.product_type);
    setEditStatus(product.status);
    setMessage("");
  }

  async function handleUpdateProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editing) return;

    const cleanCode = editCode.trim();

    if (!cleanCode) {
      setMessage("Kode produk tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("products")
      .update({
        code: cleanCode,
        product_type: editType,
        status: editStatus,
      })
      .eq("id", editing.id);

    if (error) {
      setMessage(
        error.code === "23505"
          ? "Kode produk sudah digunakan."
          : "Gagal mengubah produk: " + error.message
      );
    } else {
      setEditing(null);
      setMessage("Produk berhasil diperbarui!");
      await loadProducts();
    }

    setSaving(false);
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus produk ${product.code}? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setMessage(
        "Gagal menghapus produk. Produk mungkin sudah memiliki riwayat aktivasi. Detail: " +
          error.message
      );
    } else {
      setMessage(`Produk ${product.code} berhasil dihapus.`);
      await loadProducts();
    }

    setSaving(false);
  }

  const filteredProducts = products.filter((product) =>
    product.code.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabel = (status: string) => {
    if (status === "active") return "Aktif";
    if (status === "inactive") return "Nonaktif";
    return "Tersedia";
  };

  const statusColor = (status: string) => {
    if (status === "active") return "#059669";
    if (status === "inactive") return "#dc2626";
    return "#d97706";
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.breadcrumb}>Workspace / Manajemen Produk</p>
          <h1 style={styles.heading}>Manajemen Produk</h1>
          <p style={styles.subtitle}>
            Kelola stok produk NFC dan QR REVIEWTAP.
          </p>
        </div>

        <button
          style={styles.backButton}
          onClick={() => router.push("/dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <section style={styles.summary}>
        <div style={styles.summaryCard}>
          <span>Total Produk</span>
          <strong>{products.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Produk NFC</span>
          <strong>
            {products.filter((p) => p.product_type === "NFC").length}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Produk QR</span>
          <strong>
            {products.filter((p) => p.product_type === "QR").length}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Stok Tersedia</span>
          <strong>
            {products.filter((p) => p.status === "available").length}
          </strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Tambah Produk Baru</h2>
        <p style={styles.subtitle}>
          Daftarkan kode produk yang akan dimasukkan ke stok REVIEWTAP.
        </p>

        <form onSubmit={handleAddProduct} style={styles.form}>
          <label style={styles.field}>
            Kode Produk
            <input
              style={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: 002"
              required
            />
          </label>

          <label style={styles.field}>
            Jenis Produk
            <select
              style={styles.input}
              value={type}
              onChange={(e) => setType(e.target.value as "NFC" | "QR")}
            >
              <option value="NFC">NFC</option>
              <option value="QR">QR Code</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            style={styles.addButton}
          >
            {saving ? "Menyimpan..." : "+ Tambah Produk"}
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </section>

      <section style={styles.card}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.cardTitle}>Daftar Produk</h2>
            <p style={styles.subtitle}>
              Seluruh produk yang terdaftar di database.
            </p>
          </div>

          <input
            style={styles.search}
            placeholder="Cari kode produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={styles.empty}>Memuat data produk...</p>
        ) : filteredProducts.length === 0 ? (
          <p style={styles.empty}>Belum ada produk yang terdaftar.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Kode Produk</th>
                  <th style={styles.th}>Jenis</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Tanggal Ditambahkan</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>
                      <strong>{product.code}</strong>
                    </td>

                    <td style={styles.td}>{product.product_type}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          color: statusColor(product.status),
                        }}
                      >
                        {statusLabel(product.status)}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {new Date(product.created_at).toLocaleDateString(
                        "id-ID"
                      )}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={styles.editButton}
                          onClick={() => openEdit(product)}
                          disabled={saving}
                        >
                          Edit
                        </button>

                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDeleteProduct(product)}
                          disabled={saving}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <div style={styles.overlay}>
          <form onSubmit={handleUpdateProduct} style={styles.modal}>
            <h2 style={styles.cardTitle}>Edit Produk</h2>
            <p style={styles.subtitle}>
              Ubah informasi produk {editing.code}.
            </p>

            <label style={styles.field}>
              Kode Produk
              <input
                style={styles.input}
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                required
              />
            </label>

            <label style={styles.field}>
              Jenis Produk
              <select
                style={styles.input}
                value={editType}
                onChange={(e) =>
                  setEditType(e.target.value as "NFC" | "QR")
                }
              >
                <option value="NFC">NFC</option>
                <option value="QR">QR Code</option>
              </select>
            </label>

            <label style={styles.field}>
              Status Produk
              <select
                style={styles.input}
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(
                    e.target.value as "available" | "active" | "inactive"
                  )
                }
              >
                <option value="available">Tersedia</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="submit"
                style={styles.addButton}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      <p style={styles.footer}>
        REVIEWTAP Admin — Smart Review Management System
      </p>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f6f7fb",
    color: "#172033",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  breadcrumb: {
    color: "#929bb0",
    fontSize: "13px",
    marginBottom: "12px",
  },
  heading: {
    fontSize: "30px",
    fontWeight: 750,
    margin: 0,
  },
  subtitle: {
    color: "#8490a5",
    fontSize: "14px",
    marginTop: "8px",
  },
  backButton: {
    padding: "12px 18px",
    border: "1px solid #e2e5ee",
    background: "#fff",
    borderRadius: "10px",
    cursor: "pointer",
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  summaryCard: {
    background: "#fff",
    border: "1px solid #e8eaf1",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    color: "#718096",
    fontSize: "14px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e8eaf1",
    borderRadius: "16px",
    padding: "26px",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "19px",
    fontWeight: 700,
    margin: 0,
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    alignItems: "end",
    marginTop: "24px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    fontSize: "13px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #dfe3ed",
    borderRadius: "9px",
    fontSize: "14px",
    background: "#fff",
  },
  addButton: {
    padding: "14px 20px",
    background: "#5946e8",
    color: "#fff",
    border: 0,
    borderRadius: "9px",
    fontWeight: 650,
    cursor: "pointer",
  },
  message: {
    marginTop: "18px",
    fontSize: "14px",
    color: "#5946e8",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "22px",
  },
  search: {
    padding: "12px",
    border: "1px solid #dfe3ed",
    borderRadius: "9px",
    minWidth: "220px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "15px",
    background: "#f7f8fc",
    color: "#68758a",
    fontSize: "13px",
  },
  td: {
    padding: "16px 15px",
    borderBottom: "1px solid #edf0f5",
    fontSize: "14px",
  },
  badge: {
    fontWeight: 700,
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  editButton: {
    padding: "9px 14px",
    background: "#edeaff",
    color: "#5946e8",
    border: 0,
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 650,
  },
  deleteButton: {
    padding: "9px 14px",
    background: "#fee2e2",
    color: "#dc2626",
    border: 0,
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 650,
  },
  cancelButton: {
    padding: "12px 18px",
    background: "#f1f2f6",
    color: "#475569",
    border: 0,
    borderRadius: "9px",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  empty: {
    padding: "35px",
    textAlign: "center",
    color: "#929bb0",
  },
  footer: {
    textAlign: "center",
    color: "#929bb0",
    fontSize: "12px",
    marginTop: "30px",
  },
};
