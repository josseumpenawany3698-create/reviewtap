
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

type HistoryItem = {
  id: string;
  product_id: string;
  client_id: string;
  review_url_snapshot: string;
  action: string;
  created_at: string;
  productCode: string;
  productType: string;
  businessName: string;
};

export default function HistoryPage() {
  const router = useRouter();

  const [rows, setRows] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!supabase) {
        setError("Konfigurasi Supabase belum tersedia.");
        setLoading(false);
        return;
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !sessionData.session) {
        router.replace("/");
        return;
      }

      const { data: history, error: historyError } =
        await supabase
          .from("registration_history")
          .select("*")
          .order("created_at", { ascending: false });

      if (!active) return;

      if (historyError) {
        setError("Gagal mengambil riwayat: " + historyError.message);
        setLoading(false);
        return;
      }

      const { data: products, error: productsError } =
        await supabase
          .from("products")
          .select("id, code, product_type");

      const { data: clients, error: clientsError } =
        await supabase
          .from("clients")
          .select("id, business_name");

      if (!active) return;

      if (productsError || clientsError) {
        setError(
          "Gagal mengambil data produk atau pelanggan."
        );
        setLoading(false);
        return;
      }

      const productMap = new Map(
        (products || []).map((item) => [
          item.id,
          item,
        ])
      );

      const clientMap = new Map(
        (clients || []).map((item) => [
          item.id,
          item,
        ])
      );

      const result: HistoryItem[] = (history || []).map(
        (item) => {
          const product = productMap.get(item.product_id);
          const client = clientMap.get(item.client_id);

          return {
            ...item,
            productCode: product?.code || "-",
            productType: product?.product_type || "-",
            businessName: client?.business_name || "-",
          };
        }
      );

      setRows(result);
      setLoading(false);
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.breadcrumb}>
            Workspace / Riwayat Aktivasi
          </p>
          <h1 style={styles.title}>Riwayat Aktivasi</h1>
          <p style={styles.subtitle}>
            Pantau seluruh aktivitas aktivasi produk REVIEWTAP.
          </p>
        </div>

        <button
          style={styles.backButton}
          onClick={() => router.push("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      <section style={styles.stats}>
        <div style={styles.statCard}>
          <span>Total Aktivasi</span>
          <strong>{rows.length}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Produk NFC</span>
          <strong>
            {rows.filter((item) => item.productType === "NFC").length}
          </strong>
        </div>

        <div style={styles.statCard}>
          <span>Produk QR</span>
          <strong>
            {rows.filter((item) => item.productType === "QR").length}
          </strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Daftar Riwayat Aktivasi
        </h2>
        <p style={styles.subtitle}>
          Seluruh produk yang pernah dihubungkan dengan pelanggan.
        </p>

        {loading ? (
          <p style={styles.info}>Memuat data riwayat...</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : rows.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 36 }}>◷</div>
            <strong>Belum ada riwayat aktivasi</strong>
            <p>
              Riwayat akan muncul setelah produk berhasil diaktifkan.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Kode Produk</th>
                  <th style={styles.th}>Jenis</th>
                  <th style={styles.th}>Nama Pelanggan</th>
                  <th style={styles.th}>Aktivitas</th>
                  <th style={styles.th}>Tanggal Aktivasi</th>
                  <th style={styles.th}>Google Review</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <strong>{item.productCode}</strong>
                    </td>
                    <td style={styles.td}>
                      {item.productType}
                    </td>
                    <td style={styles.td}>
                      {item.businessName}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.status}>
                        {item.action === "activated"
                          ? "Aktivasi"
                          : item.action}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(item.created_at).toLocaleString(
                        "id-ID",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      )}
                    </td>
                    <td style={styles.td}>
                      <a
                        href={item.review_url_snapshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                      >
                        Lihat Review ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer style={styles.footer}>
        REVIEWTAP Admin — Smart Review Management System
      </footer>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: "40px",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "32px",
  },
  breadcrumb: {
    color: "#8492a9",
    marginBottom: "12px",
  },
  title: {
    fontSize: "34px",
    margin: "0 0 10px",
  },
  subtitle: {
    color: "#8492a9",
    fontSize: "16px",
    marginTop: "8px",
  },
  backButton: {
    background: "#fff",
    border: "1px solid #e1e6ef",
    borderRadius: "12px",
    padding: "15px 22px",
    fontSize: "16px",
    cursor: "pointer",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e7eaf1",
    borderRadius: "18px",
    padding: "25px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    color: "#78869c",
  },
  card: {
    background: "#fff",
    border: "1px solid #e7eaf1",
    borderRadius: "18px",
    padding: "28px",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: "23px",
    margin: "0",
  },
  info: {
    padding: "30px 0",
    color: "#78869c",
  },
  error: {
    padding: "25px 0",
    color: "#dc2626",
  },
  empty: {
    textAlign: "center",
    padding: "65px 20px",
    color: "#78869c",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  tableWrapper: {
    overflowX: "auto",
    marginTop: "28px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
    textAlign: "left",
  },
  th: {
    background: "#f6f7fb",
    color: "#718096",
    padding: "18px 15px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "20px 15px",
    borderBottom: "1px solid #edf0f5",
    fontSize: "15px",
  },
  status: {
    color: "#059669",
    background: "#dcfce7",
    padding: "7px 12px",
    borderRadius: "8px",
    fontWeight: 600,
  },
  link: {
    color: "#5945ed",
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  footer: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: "35px",
    fontSize: "14px",
  },
};
