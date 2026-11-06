
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Client = {
  id: string;
  business_name: string;
  place_id: string;
  review_url: string;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
};

const initialForm = {
  business_name: "",
  place_id: "",
  review_url: "",
  contact_name: "",
  contact_phone: "",
  notes: "",
};

export default function ClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/");
        return;
      }

      await loadClients(mounted);
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function loadClients(mounted = true) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!mounted) return;

    if (error) {
      setMessage("Gagal mengambil data pelanggan: " + error.message);
      setMessageError(true);
    } else {
      setClients((data || []) as Client[]);
    }

    setLoading(false);
  }

  function updateField(
    field: keyof typeof initialForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setMessageError(false);

    if (!form.business_name.trim()) {
      setMessage("Nama bisnis wajib diisi.");
      setMessageError(true);
      return;
    }

    if (!form.place_id.trim() || !form.review_url.trim()) {
      setMessage("Google Place ID dan Google Review URL wajib diisi.");
      setMessageError(true);
      return;
    }

    try {
      new URL(form.review_url.trim());
    } catch {
      setMessage("Google Review URL tidak valid.");
      setMessageError(true);
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("clients").insert({
      business_name: form.business_name.trim(),
      place_id: form.place_id.trim(),
      review_url: form.review_url.trim(),
      contact_name: form.contact_name.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      notes: form.notes.trim() || null,
    });

    if (error) {
      setMessage("Gagal menyimpan pelanggan: " + error.message);
      setMessageError(true);
    } else {
      setForm(initialForm);
      setMessage("Data pelanggan berhasil ditambahkan!");
      setMessageError(false);
      await loadClients();
    }

    setSaving(false);
  }

  const filteredClients = clients.filter((client) => {
    const keyword = search.toLowerCase();

    return (
      client.business_name.toLowerCase().includes(keyword) ||
      (client.contact_name || "").toLowerCase().includes(keyword) ||
      (client.contact_phone || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.breadcrumb}>
            Workspace / Data Pelanggan
          </p>
          <h1 style={styles.heading}>Data Pelanggan</h1>
          <p style={styles.subtitle}>
            Kelola informasi bisnis yang menggunakan REVIEWTAP.
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
          <span>Total Pelanggan</span>
          <strong>{clients.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Terdaftar</span>
          <strong>{clients.length}</strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Tambah Pelanggan Baru</h2>
        <p style={styles.subtitle}>
          Masukkan informasi bisnis dan tautan Google Review pelanggan.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            Nama Bisnis *
            <input
              style={styles.input}
              value={form.business_name}
              onChange={(e) =>
                updateField("business_name", e.target.value)
              }
              placeholder="Contoh: Warkop GGS"
              required
            />
          </label>

          <label style={styles.field}>
            Nama Pemilik / Kontak
            <input
              style={styles.input}
              value={form.contact_name}
              onChange={(e) =>
                updateField("contact_name", e.target.value)
              }
              placeholder="Nama pemilik bisnis"
            />
          </label>

          <label style={styles.field}>
            Nomor WhatsApp
            <input
              style={styles.input}
              value={form.contact_phone}
              onChange={(e) =>
                updateField("contact_phone", e.target.value)
              }
              placeholder="Contoh: 081234567890"
            />
          </label>

          <label style={styles.field}>
            Google Place ID *
            <input
              style={styles.input}
              value={form.place_id}
              onChange={(e) =>
                updateField("place_id", e.target.value)
              }
              placeholder="Masukkan Google Place ID"
              required
            />
          </label>

          <label style={styles.field}>
            Google Review URL *
            <input
              style={styles.input}
              value={form.review_url}
              onChange={(e) =>
                updateField("review_url", e.target.value)
              }
              placeholder="https://search.google.com/local/writereview?..."
              required
            />
          </label>

          <label style={styles.field}>
            Catatan
            <textarea
              style={styles.textarea}
              value={form.notes}
              onChange={(e) =>
                updateField("notes", e.target.value)
              }
              placeholder="Catatan tambahan tentang pelanggan..."
              rows={3}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.addButton,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Menyimpan..." : "+ Tambah Pelanggan"}
          </button>
        </form>

        {message && (
          <p
            style={{
              ...styles.message,
              color: messageError ? "#dc2626" : "#5946e8",
            }}
          >
            {message}
          </p>
        )}
      </section>

      <section style={styles.card}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.cardTitle}>Daftar Pelanggan</h2>
            <p style={styles.subtitle}>
              Seluruh bisnis yang sudah terdaftar di REVIEWTAP.
            </p>
          </div>

          <input
            style={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama bisnis..."
          />
        </div>

        {loading ? (
          <p style={styles.empty}>Memuat data pelanggan...</p>
        ) : filteredClients.length === 0 ? (
          <p style={styles.empty}>
            Belum ada data pelanggan.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nama Bisnis</th>
                  <th style={styles.th}>Kontak</th>
                  <th style={styles.th}>WhatsApp</th>
                  <th style={styles.th}>Tanggal Terdaftar</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td style={styles.td}>
                      <strong>{client.business_name}</strong>
                    </td>
                    <td style={styles.td}>
                      {client.contact_name || "-"}
                    </td>
                    <td style={styles.td}>
                      {client.contact_phone || "-"}
                    </td>
                    <td style={styles.td}>
                      {new Date(client.created_at).toLocaleDateString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    flexWrap: "wrap",
    marginBottom: "30px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
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
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #dfe3ed",
    borderRadius: "9px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  addButton: {
    gridColumn: "1 / -1",
    padding: "15px 20px",
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
  empty: {
    padding: "35px",
    textAlign: "center",
    color: "#929bb0",
  },
};
