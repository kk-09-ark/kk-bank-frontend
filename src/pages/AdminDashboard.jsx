import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getAllUsers, updateUser, deleteUser, getAllPayments, adminCreateNote, adminUpdateNote, adminDeleteNote, getSubscriptions, grantAccess, revokeAccess } from "../api/admin";
import { getAllNotes } from "../api/notes";
import { uploadPdf, uploadImage } from "../api/upload";
import { downloadNote } from "../utils/download";

const styles = {
  root: {
    minHeight: "100vh", background: "#16261F", color: "#F3F1E7",
    fontFamily: "Inter, sans-serif", padding: "0 24px 48px"
  },
  wrap: { maxWidth: 1200, margin: "0 auto" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 0", borderBottom: "1px solid #33513F", marginBottom: 32
  },
  title: { fontFamily: "'Kalam', cursive", fontSize: 24 },
  badge: { fontSize: 12, color: "#A9BBAF" },
  logoutBtn: {
    background: "transparent", border: "1px solid #33513F", color: "#A9BBAF",
    padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13
  },
  tabs: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  tab: (active) => ({
    padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13,
    background: active ? "#E8C468" : "transparent",
    color: active ? "#16261F" : "#A9BBAF",
    border: active ? "none" : "1px solid #33513F",
    fontWeight: active ? 600 : 400
  }),
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 },
  statCard: {
    background: "#1E332A", border: "1px solid #33513F", borderRadius: 14, padding: 24
  },
  statNum: { fontFamily: "'Kalam', cursive", fontSize: 32, color: "#E8C468" },
  statLabel: { fontSize: 13, color: "#A9BBAF", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #33513F", color: "#A9BBAF", fontWeight: 600 },
  td: { padding: "10px 12px", borderBottom: "1px solid #243D32", color: "#F3F1E7" },
  actionBtn: (color = "#E8C468") => ({
    background: "transparent", border: `1px solid ${color}`, color,
    padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, marginRight: 6
  }),
  modal: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24
  },
  modalBody: {
    background: "#1E332A", border: "1px solid #33513F", borderRadius: 20,
    padding: 36, width: "100%", maxWidth: 480
  },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "#243D32", border: "1px solid #33513F",
    color: "#F3F1E7", fontSize: 14, outline: "none", marginBottom: 12
  },
  textarea: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "#243D32", border: "1px solid #33513F",
    color: "#F3F1E7", fontSize: 14, outline: "none", marginBottom: 12,
    minHeight: 80, resize: "vertical"
  },
  btn: {
    padding: "10px 20px", borderRadius: 8, background: "#E8C468",
    color: "#16261F", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer"
  },
  fileInput: {
    width: "100%", padding: "8px 14px", borderRadius: 8,
    background: "#243D32", border: "1px solid #33513F",
    color: "#F3F1E7", fontSize: 13, outline: "none", marginBottom: 12,
    cursor: "pointer"
  }
};

const resolveAsset = (url) =>
  url && !url.startsWith("http")
    ? `${import.meta.env.VITE_API_BASE_URL || ""}${url}`
    : url;

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: "", description: "", pdfUrl: "", price: "", active: true });
  const [pdfFile, setPdfFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [grantEmail, setGrantEmail] = useState("");

  useEffect(() => { if (tab === "stats") loadStats(); if (tab === "users") loadUsers(); if (tab === "notes") loadNotes(); if (tab === "payments") loadPayments(); if (tab === "subscriptions") loadSubscriptions(); }, [tab]);

  const loadStats = async () => { try { const r = await getStats(); setStats(r.data); } catch {} };
  const loadUsers = async () => { try { const r = await getAllUsers(); setUsers(r.data); } catch {} };
  const loadNotes = async () => { try { const r = await getAllNotes(); setNotes(r.data); } catch {} };
  const loadPayments = async () => { try { const r = await getAllPayments(); setPayments(r.data); } catch {} };
  const loadSubscriptions = async () => { try { const r = await getSubscriptions(); setSubscriptions(r.data); } catch {} };

  const handleGrantAccess = async (email) => {
    if (!confirm(`Grant premium access to ${email}?`)) return;
    try { await grantAccess(email); loadSubscriptions(); } catch { alert("Failed to grant access"); }
  };

  const handleRevokeAccess = async (userId) => {
    if (!confirm("Revoke premium access?")) return;
    try { await revokeAccess(userId); loadSubscriptions(); } catch { alert("Failed to revoke access"); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try { await deleteUser(id); loadUsers(); } catch {}
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      });
      setEditingUser(null);
      loadUsers();
    } catch {}
  };

  const handleSaveNote = async () => {
    setUploading(true);
    try {
      let pdfUrl = noteForm.pdfUrl;
      let thumbnailUrl = noteForm.thumbnailUrl;
      if (pdfFile) {
        const uploadRes = await uploadPdf(pdfFile);
        pdfUrl = uploadRes.data.url;
      }
      if (thumbnailFile) {
        const uploadRes = await uploadImage(thumbnailFile);
        thumbnailUrl = uploadRes.data.url;
      }
      const payload = { title: noteForm.title, description: noteForm.description, pdfUrl, thumbnailUrl, price: parseFloat(noteForm.price) || 0, active: noteForm.active };
      if (editingNote) {
        await adminUpdateNote(editingNote.id, payload);
      } else {
        await adminCreateNote(payload);
      }
      setShowNoteModal(false);
      setEditingNote(null);
      setPdfFile(null);
      setThumbnailFile(null);
      setNoteForm({ title: "", description: "", pdfUrl: "", thumbnailUrl: "", price: "", active: true });
      loadNotes();
    } catch (err) {
      alert("Failed to save note");
    }
    setUploading(false);
  };

  const handleDeleteNote = async (id) => {
    if (!confirm("Delete this note?")) return;
    try { await adminDeleteNote(id); loadNotes(); } catch {}
  };

  const openNewNote = () => {
    setEditingNote(null);
    setPdfFile(null);
    setThumbnailFile(null);
    setNoteForm({ title: "", description: "", pdfUrl: "", thumbnailUrl: "", price: "", active: true });
    setShowNoteModal(true);
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setPdfFile(null);
    setThumbnailFile(null);
    setNoteForm({ title: note.title, description: note.description, pdfUrl: note.pdfUrl || "", thumbnailUrl: note.thumbnailUrl || "", price: note.price.toString(), active: note.active });
    setShowNoteModal(true);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStats = () => (
    <div>
      <div className="stats-grid" style={styles.statsGrid}>
        {stats ? <>
          <div style={styles.statCard}><div style={styles.statNum}>{stats.totalUsers}</div><div style={styles.statLabel}>Total Users</div></div>
          <div style={styles.statCard}><div style={styles.statNum}>{stats.totalNotes}</div><div style={styles.statLabel}>Total Notes</div></div>
          <div style={styles.statCard}><div style={styles.statNum}>{stats.activeNotes}</div><div style={styles.statLabel}>Active Notes</div></div>
          <div style={styles.statCard}><div style={styles.statNum}>{stats.totalPurchases}</div><div style={styles.statLabel}>Total Purchases</div></div>
          <div style={styles.statCard}><div style={styles.statNum}>₹{stats.totalRevenue.toFixed(2)}</div><div style={styles.statLabel}>Total Revenue</div></div>
        </> : <div style={{ color: "#A9BBAF" }}>Loading stats...</div>}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        style={{ ...styles.input, maxWidth: 300, marginBottom: 16 }} />
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Email</th>
          <th style={styles.th}>Role</th>
          <th style={styles.th}>Created</th>
          <th style={styles.th}>Actions</th>
        </tr></thead>
        <tbody>
          {filteredUsers.map(u => (
            <tr key={u.id}>
              <td style={styles.td}>{u.name}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}><span style={{ color: u.role === "ROLE_ADMIN" ? "#E8C468" : "#A9BBAF" }}>{u.role}</span></td>
              <td style={styles.td}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
              <td style={styles.td}>
                <button style={styles.actionBtn()} onClick={() => setEditingUser(u)}>Edit</button>
                <button style={styles.actionBtn("#ff5f56")} onClick={() => handleDeleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingUser && (
        <div style={styles.modal} onClick={() => setEditingUser(null)}>
          <div style={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 20, marginBottom: 16 }}>Edit User</h3>
            <input style={styles.input} value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} placeholder="Name" />
            <input style={styles.input} value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} placeholder="Email" />
            <select style={styles.input} value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
              <option value="ROLE_USER">User</option>
              <option value="ROLE_ADMIN">Admin</option>
            </select>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={{ ...styles.actionBtn(), fontSize: 13 }} onClick={() => setEditingUser(null)}>Cancel</button>
              <button style={{ ...styles.btn }} onClick={handleUpdateUser}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotes = () => (
    <div>
      <button style={{ ...styles.btn, marginBottom: 16 }} onClick={openNewNote}>+ Add Note</button>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Title</th>
          <th style={styles.th}>Price</th>
          <th style={styles.th}>PDF</th>
          <th style={styles.th}>Active</th>
          <th style={styles.th}>Actions</th>
        </tr></thead>
        <tbody>
          {notes.map(n => (
            <tr key={n.id}>
              <td style={{ ...styles.td, fontSize: 11, color: "#A9BBAF", fontFamily: "'JetBrains Mono', monospace" }}>{n.id?.substring(0, 8)}</td>
              <td style={styles.td}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {n.thumbnailUrl && (
                    <img src={resolveAsset(n.thumbnailUrl)} alt="" style={{ width: 32, height: 22, borderRadius: 4, objectFit: "cover", background: "#14261E" }} />
                  )}
                  <div>
                    <div>{n.title}</div>
                    {n.description && <div style={{ fontSize: 11, color: "#A9BBAF" }}>{n.description.substring(0, 50)}</div>}
                  </div>
                </div>
              </td>
              <td style={styles.td}>₹{n.price}</td>
              <td style={styles.td}>
                {n.pdfUrl ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 10, color: "#A9BBAF" }}>{n.pdfUrl.split("/").pop()}</span>
                    <div>
                      <a href={resolveAsset(n.pdfUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#E8C468", fontSize: 11, textDecoration: "none" }}>View →</a>
                      <button onClick={() => downloadNote(n)} style={{ color: "#E8C468", fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 10 }}>Download</button>
                    </div>
                  </div>
                ) : <span style={{ color: "#A9BBAF", fontSize: 11 }}>No file</span>}
              </td>
              <td style={styles.td}><span style={{ color: n.active ? "#27c93f" : "#ff5f56", fontSize: 11 }}>{n.active ? "Active" : "Inactive"}</span></td>
              <td style={styles.td}>
                <button style={styles.actionBtn()} onClick={() => openEditNote(n)}>Edit</button>
                <button style={styles.actionBtn("#ff5f56")} onClick={() => handleDeleteNote(n.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showNoteModal && (
        <div style={styles.modal} onClick={() => setShowNoteModal(false)}>
          <div style={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 20, marginBottom: 16 }}>
              {editingNote ? "Edit Note" : "Add Note"}
            </h3>
            <input style={styles.input} placeholder="Title" value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
            <textarea style={styles.textarea} placeholder="Description" value={noteForm.description}
              onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })} />
            <input style={styles.fileInput} type="file" accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])} />
            {noteForm.pdfUrl && !pdfFile && (
              <div style={{ fontSize: 11, color: "#A9BBAF", marginBottom: 12 }}>
                Current PDF: <a href={resolveAsset(noteForm.pdfUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#E8C468" }}>view file</a>
                {editingNote && <span> (select a new file to replace)</span>}
              </div>
            )}
            <label style={{ fontSize: 11, color: "#A9BBAF", display: "block", marginBottom: 4 }}>THUMBNAIL IMAGE</label>
            <input style={styles.fileInput} type="file" accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files[0])} />
            {noteForm.thumbnailUrl && !thumbnailFile && (
              <div style={{ fontSize: 11, color: "#A9BBAF", marginBottom: 12 }}>
                Current: <a href={resolveAsset(noteForm.thumbnailUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#E8C468" }}>view image</a>
                {editingNote && <span> (select a new file to replace)</span>}
              </div>
            )}
            <input style={styles.input} placeholder="Price" type="number" value={noteForm.price}
              onChange={(e) => setNoteForm({ ...noteForm, price: e.target.value })} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#A9BBAF", marginBottom: 16 }}>
              <input type="checkbox" checked={noteForm.active}
                onChange={(e) => setNoteForm({ ...noteForm, active: e.target.checked })} />
              Active
            </label>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button style={{ ...styles.actionBtn(), fontSize: 13 }} onClick={() => setShowNoteModal(false)}>Cancel</button>
              <button style={{ ...styles.btn, opacity: uploading ? 0.7 : 1 }} onClick={handleSaveNote} disabled={uploading}>
                {uploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <table style={styles.table}>
      <thead><tr>
        <th style={styles.th}>User ID</th>
        <th style={styles.th}>Payment ID</th>
        <th style={styles.th}>Order ID</th>
        <th style={styles.th}>Amount</th>
        <th style={styles.th}>Date</th>
        <th style={styles.th}>Status</th>
      </tr></thead>
      <tbody>
        {payments.map(p => (
          <tr key={p.id}>
            <td style={styles.td}>{p.userId}</td>
            <td style={styles.td}>{p.paymentId || "-"}</td>
            <td style={styles.td}>{p.orderId || "-"}</td>
            <td style={styles.td}>₹{p.amount}</td>
            <td style={styles.td}>{p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : "-"}</td>
            <td style={styles.td}><span style={{ color: p.status === "completed" ? "#27c93f" : "#E8C468" }}>{p.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSubscriptions = () => (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input style={{ ...styles.input, marginBottom: 0, flex: 1, maxWidth: 350 }}
          placeholder="Enter email to grant premium access" value={grantEmail}
          onChange={(e) => setGrantEmail(e.target.value)} />
        <button style={styles.btn} onClick={async () => {
          if (!grantEmail.trim()) return;
          await handleGrantAccess(grantEmail.trim());
          setGrantEmail("");
        }}>Grant Access</button>
      </div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Email</th>
          <th style={styles.th}>Role</th>
          <th style={styles.th}>Premium</th>
          <th style={styles.th}>Actions</th>
        </tr></thead>
        <tbody>
          {subscriptions.map(s => (
            <tr key={s.userId}>
              <td style={styles.td}>{s.name}</td>
              <td style={styles.td}>{s.email}</td>
              <td style={styles.td}><span style={{ color: s.role === "ROLE_ADMIN" ? "#E8C468" : "#A9BBAF" }}>{s.role}</span></td>
              <td style={styles.td}>
                <span style={{ color: s.hasPremium ? "#27c93f" : "#ff5f56", fontWeight: 600, fontSize: 12 }}>
                  {s.hasPremium ? "Active" : "None"}
                </span>
              </td>
              <td style={styles.td}>
                {s.hasPremium ? (
                  <button style={styles.actionBtn("#ff5f56")} onClick={() => handleRevokeAccess(s.userId)}>Revoke</button>
                ) : (
                  <button style={styles.actionBtn("#27c93f")} onClick={() => handleGrantAccess(s.email)}>Grant</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={styles.root}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div><span style={styles.title}>Admin Panel</span><div style={styles.badge}>{user.email}</div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.logoutBtn} onClick={() => navigate("/")}>Home</button>
            <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
          </div>
        </div>
        <div style={styles.tabs}>
          {["stats", "users", "notes", "payments", "subscriptions"].map(t => (
            <button key={t} style={styles.tab(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === "stats" && renderStats()}
        {tab === "users" && renderUsers()}
        {tab === "notes" && renderNotes()}
        {tab === "payments" && renderPayments()}
        {tab === "subscriptions" && renderSubscriptions()}
      </div>
    </div>
  );
}
