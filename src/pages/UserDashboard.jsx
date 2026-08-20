import { useState, useEffect, useRef } from "react";
import { getAllNotes } from "../api/notes";
import { checkPurchase, getPurchaseByUserId, checkMyPurchase } from "../api/bundle";
import { createOrder, verifyPayment } from "../api/payment";
import { downloadNote } from "../utils/download";

function loadRazorpay(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const sectionStyle = {
  padding: "40px 0", borderTop: "1px solid #33513F"
};

const wrapStyle = {
  maxWidth: 1120, margin: "0 auto", padding: "0 24px"
};

export default function UserDashboard({ user, onBack }) {
  const [notes, setNotes] = useState([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const purchasedRef = useRef(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const resolveAsset = (url) =>
    url && !url.startsWith("http")
      ? `${import.meta.env.VITE_API_BASE_URL || ""}${url}`
      : url;

  const loadData = async () => {
    setLoading(true);
    try {
      const notesRes = await getAllNotes();
      setNotes((Array.isArray(notesRes.data) ? notesRes.data : []).map((n) => ({ ...n, thumbnailUrl: resolveAsset(n.thumbnailUrl), pdfUrl: resolveAsset(n.pdfUrl) })));
      if (user.userId) {
        const checkRes = await checkPurchase(user.userId);
        setHasPurchased(checkRes.data || purchasedRef.current);
        if (checkRes.data) {
          const purchRes = await getPurchaseByUserId(user.userId);
          setPurchaseInfo(purchRes.data);
        }
      }
      if (user.token) {
        const meRes = await checkMyPurchase();
        setHasPurchased((meRes.data?.purchased === true) || purchasedRef.current);
        if (meRes.data?.purchase) setPurchaseInfo(meRes.data.purchase);
      }
    } catch {}
    setLoading(false);
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const res = await createOrder(22);
      const { orderId, amount, currency, key } = res.data;

      const loaded = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        alert("Failed to load Razorpay SDK");
        setPaying(false);
        return;
      }

      const options = {
        key,
        amount: amount * 100,
        currency,
        name: "CodeWithKK Notes",
        description: "Premium Notes Bundle",
        order_id: orderId,
        handler: async function (response) {
          try {
            const verified = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              userId: user.userId,
              amount: 22,
            });
            alert("Payment successful! You now have lifetime access.");
            purchasedRef.current = true;
            setHasPurchased(true);
            setPurchaseInfo(verified.data);
            loadData();
          } catch {
            alert("Payment verification failed. Contact support.");
          }
        },
        prefill: { email: user.email },
        theme: { color: "#E8C468" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function () {
        alert("Payment failed. Please try again.");
        setPaying(false);
      });
      razorpay.open();
    } catch (err) {
      alert("Failed to initiate payment");
      setPaying(false);
    }
  };

  const activeNotes = Array.isArray(notes) ? notes.filter((n) => n.active) : [];

  return (
    <div style={{ background: "#16261F", color: "#F3F1E7", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(22,38,31,0.75)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid #33513F"
      }}>
        <div style={{ ...wrapStyle, display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ fontFamily: "'Kalam', cursive", fontSize: 18 }}>
            <span style={{ color: "#E8C468" }}>codewith_kk</span> / dashboard
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#A9BBAF" }}>{user.email}</span>
            <button onClick={onBack}
              style={{
                background: "transparent", border: "1px solid #33513F",
                color: "#A9BBAF", padding: "6px 14px", borderRadius: 8,
                cursor: "pointer", fontSize: 12
              }}>Back to Home</button>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={wrapStyle}>
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "'Kalam', cursive", fontSize: 28, marginBottom: 8
            }}>
              {hasPurchased ? "Your Notes Library" : "Unlock Your Bundle"}
            </div>
            <p style={{ color: "#A9BBAF", fontSize: 14, maxWidth: 500 }}>
              {hasPurchased
                ? "Download any PDF — new ones appear automatically."
                : "One-time payment for lifetime access to all current and future PDFs."}
            </p>
          </div>

          {!hasPurchased && !loading && (
            <div style={{
              background: "#1E332A", border: "1px solid #33513F", borderRadius: 20,
              padding: 36, marginBottom: 32, maxWidth: 480
            }}>
              <div style={{
                fontFamily: "'Kalam', cursive", fontSize: 42, color: "#E8C468", marginBottom: 4
              }}>₹22</div>
              <div style={{ fontSize: 13, color: "#A9BBAF", marginBottom: 20 }}>
                Lifetime access · {activeNotes.length} PDFs available
              </div>
              <button onClick={handlePayment} disabled={paying}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 10,
                  background: "#E8C468", color: "#16261F",
                  fontWeight: 700, fontSize: 15, border: "none", cursor: paying ? "not-allowed" : "pointer",
                  opacity: paying ? 0.7 : 1
                }}>
                {paying ? "Processing..." : "Pay Now — ₹22"}
              </button>
            </div>
          )}

          {hasPurchased && purchaseInfo && (
            <div style={{
              background: "#1E332A", border: "1px solid #33513F", borderRadius: 14,
              padding: 16, marginBottom: 32, maxWidth: 480, fontSize: 13, color: "#A9BBAF"
            }}>
              Purchased on: {purchaseInfo.purchaseDate ? new Date(purchaseInfo.purchaseDate).toLocaleDateString() : "-"}
              {purchaseInfo.paymentId && <span> · Payment ID: {purchaseInfo.paymentId}</span>}
            </div>
          )}

          {loading ? (
            <div style={{ color: "#A9BBAF", fontSize: 14 }}>Loading notes...</div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16
            }}>
              {activeNotes.map((note) => (
                <div key={note.id} style={{
                  background: "#1E332A", border: "1px solid #33513F",
                  borderRadius: 12, padding: 20, transition: "border-color .2s"
                }}>
                  {note.thumbnailUrl && (
                    <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", aspectRatio: "1.4", background: "#14261E" }}>
                      <img src={note.thumbnailUrl} alt={note.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                    fontSize: 14, marginBottom: 6
                  }}>{note.title}</div>
                  <div style={{
                    color: "#A9BBAF", fontSize: 13, lineHeight: 1.5, marginBottom: 12
                  }}>{note.description}</div>
                  {hasPurchased && note.pdfUrl ? (
                    <button onClick={() => downloadNote(note)}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                        color: "#E8C468", background: "transparent", border: "none",
                        textDecoration: "none", cursor: "pointer", padding: 0,
                        display: "inline-flex", alignItems: "center", gap: 4
                      }}>
                      Download PDF →
                    </button>
                  ) : !hasPurchased ? (
                    <span style={{ color: "#A9BBAF", fontSize: 12 }}>
                      Purchase to unlock
                    </span>
                  ) : (
                    <span style={{ color: "#A9BBAF", fontSize: 12 }}>
                      Coming soon
                    </span>
                  )}
                </div>
              ))}
              {activeNotes.length === 0 && (
                <div style={{ color: "#A9BBAF", fontSize: 14 }}>No notes available yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
