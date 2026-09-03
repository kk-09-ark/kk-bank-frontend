import { useState, useEffect, useRef } from "react";
import { getAllNotes } from "../api/notes";
import { checkPurchase, getPurchaseByUserId, checkMyPurchase } from "../api/bundle";
import { createOrder, verifyPayment } from "../api/payment";
import { downloadNote } from "../utils/download";

const BUNDLES = [
  { id: "interview", title: "Interview Preparation", price: 22, color: "#D97706", icon: "\u{1F3AF}" },
  { id: "notes", title: "Study Notes & Cheatsheets", price: 22, color: "#059669", icon: "\u{1F4DA}" },
  { id: "combo", title: "Combo Bundle", price: 39, color: "#7C3AED", icon: "\u{26A1}" },
];

function loadRazorpay(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function UserDashboard({ user, onBack }) {
  const [notes, setNotes] = useState([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
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
      setNotes(
        (Array.isArray(notesRes.data) ? notesRes.data : []).map((n) => ({
          ...n,
          thumbnailUrl: resolveAsset(n.thumbnailUrl),
          pdfUrl: resolveAsset(n.pdfUrl),
        }))
      );
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
        setHasPurchased(meRes.data?.purchased === true || purchasedRef.current);
        if (meRes.data?.purchase) setPurchaseInfo(meRes.data.purchase);
      }
    } catch {}
    setLoading(false);
  };

  const handlePayment = async (bundle) => {
    setSelectedBundle(bundle);
    setPaying(true);
    try {
      const res = await createOrder(bundle.price);
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
        description: bundle.title,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verified = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              userId: user.userId,
              amount: bundle.price,
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
        theme: { color: bundle.color },
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
    <div style={{ background: "#FFFBF0", color: "#1A1A1A", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,251,240,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8DCC8"
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ fontFamily: "'Kalam', cursive", fontSize: 18 }}>
            <span style={{ color: "#D97706" }}>codewith_kk</span> / dashboard
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6B6B6B" }}>{user.email}</span>
            <button onClick={onBack} style={{
              background: "transparent", border: "1px solid #E8DCC8",
              color: "#6B6B6B", padding: "6px 14px", borderRadius: 8,
              cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace"
            }}>Back to Home</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "40px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Kalam', cursive", fontSize: 28, marginBottom: 8 }}>
              {hasPurchased ? "Your Notes Library" : "Unlock Your Bundle"}
            </div>
            <p style={{ color: "#6B6B6B", fontSize: 14, maxWidth: 500 }}>
              {hasPurchased
                ? "Download any PDF \u2014 new ones appear automatically."
                : "Choose a bundle below. One-time payment, lifetime access."}
            </p>
          </div>

          {!hasPurchased && !loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32, maxWidth: 900 }}>
              {BUNDLES.map((b) => (
                <div key={b.id} onClick={() => setSelectedBundle(b)} style={{
                  background: "#FFFFFF", border: `2px solid ${selectedBundle?.id === b.id ? b.color : "#E8DCC8"}`,
                  borderRadius: 16, padding: 24, cursor: "pointer",
                  transition: "border-color .2s, box-shadow .2s",
                  boxShadow: selectedBundle?.id === b.id ? `0 8px 30px -10px ${b.color}40` : "none"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{b.icon}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 28, color: b.color }}>
                      {"\u20B9"}{b.price}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B6B6B" }}>
                    {b.id === "interview" && "HR, Technical, Java, SQL, DSA prep PDFs"}
                    {b.id === "notes" && "Cheatsheets, handouts, revision sheets"}
                    {b.id === "combo" && "Everything included \u2014 best value"}
                  </div>
                  {b.id === "combo" && (
                    <div style={{
                      marginTop: 10, display: "inline-block",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 20,
                      background: `${b.color}15`, color: b.color
                    }}>SAVE {"\u20B9"}6</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!hasPurchased && !loading && selectedBundle && (
            <button onClick={() => handlePayment(selectedBundle)} disabled={paying} style={{
              padding: "14px 32px", borderRadius: 10,
              background: selectedBundle.color, color: "#FFFFFF",
              fontWeight: 700, fontSize: 15, border: "none",
              cursor: paying ? "not-allowed" : "pointer",
              opacity: paying ? 0.7 : 1,
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: `0 4px 20px ${selectedBundle.color}40`
            }}>
              {paying ? "Processing..." : `Pay ${"\u20B9"}${selectedBundle.price} \u2014 ${selectedBundle.title}`}
            </button>
          )}

          {!hasPurchased && !loading && !selectedBundle && (
            <div style={{ color: "#6B6B6B", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
              Select a bundle above to continue
            </div>
          )}

          {hasPurchased && purchaseInfo && (
            <div style={{
              background: "#FFFFFF", border: "1px solid #E8DCC8", borderRadius: 14,
              padding: 16, marginBottom: 32, maxWidth: 480, fontSize: 13, color: "#6B6B6B"
            }}>
              Purchased on: {purchaseInfo.purchaseDate ? new Date(purchaseInfo.purchaseDate).toLocaleDateString() : "-"}
              {purchaseInfo.paymentId && <span> · Payment ID: {purchaseInfo.paymentId}</span>}
            </div>
          )}

          {loading ? (
            <div style={{ color: "#6B6B6B", fontSize: 14 }}>Loading notes...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {activeNotes.map((note) => (
                <div key={note.id} style={{
                  background: "#FFFFFF", border: "1px solid #E8DCC8",
                  borderRadius: 12, padding: 20, transition: "border-color .2s"
                }}>
                  {note.thumbnailUrl && (
                    <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", aspectRatio: "1.4", background: "#FFF7E6" }}>
                      <img src={note.thumbnailUrl} alt={note.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                    {note.title}
                  </div>
                  <div style={{ color: "#6B6B6B", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                    {note.description}
                  </div>
                  {hasPurchased && note.pdfUrl ? (
                    <button onClick={() => downloadNote(note)} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      color: "#D97706", background: "transparent", border: "none",
                      cursor: "pointer", padding: 0,
                      display: "inline-flex", alignItems: "center", gap: 4
                    }}>
                      Download PDF {"\u2192"}
                    </button>
                  ) : !hasPurchased ? (
                    <span style={{ color: "#6B6B6B", fontSize: 12 }}>Purchase to unlock</span>
                  ) : (
                    <span style={{ color: "#6B6B6B", fontSize: 12 }}>Coming soon</span>
                  )}
                </div>
              ))}
              {activeNotes.length === 0 && (
                <div style={{ color: "#6B6B6B", fontSize: 14 }}>No notes available yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
