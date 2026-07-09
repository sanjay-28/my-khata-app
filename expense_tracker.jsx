import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Plus, X, Trash2, Wallet, TrendingUp, IndianRupee,
  Smartphone, CreditCard, Banknote, Landmark, HelpCircle, Pencil,
} from "lucide-react";

const CATEGORIES = [
  { name: "Food", color: "#D9A02D" },
  { name: "Transport", color: "#0F5C53" },
  { name: "Shopping", color: "#B33F2B" },
  { name: "Bills", color: "#3B5BA5" },
  { name: "Health", color: "#7A5C9E" },
  { name: "Entertainment", color: "#C46A3E" },
  { name: "Groceries", color: "#4F7942" },
  { name: "Other", color: "#8A8578" },
];

const METHODS = [
  { name: "UPI", icon: Smartphone },
  { name: "Cash", icon: Banknote },
  { name: "Card", icon: CreditCard },
  { name: "Net Banking", icon: Landmark },
  { name: "Other", icon: HelpCircle },
];

const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM", "Other UPI"];

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKey = (d) => d.slice(0, 7);
const fmt = (n) => "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const seed = [
  { id: "1", date: todayStr(), amount: 450, category: "Food", method: "UPI", upiApp: "Google Pay", note: "Lunch with team" },
  { id: "2", date: todayStr(), amount: 1200, category: "Groceries", method: "UPI", upiApp: "PhonePe", note: "Weekly groceries" },
  { id: "3", date: todayStr(), amount: 299, category: "Entertainment", method: "Card", note: "Movie tickets" },
  { id: "4", date: todayStr(), amount: 80, category: "Transport", method: "UPI", upiApp: "Paytm", note: "Auto ride" },
  { id: "5", date: todayStr(), amount: 2500, category: "Bills", method: "Net Banking", note: "Electricity bill" },
];

function Modal({ onClose, children, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,30,28,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#F6F4EC", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto", fontFamily: "Inter, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: "#16332F", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ExpenseTracker() {
  const [txns, setTxns] = useState(seed);
  const [month, setMonth] = useState(monthKey(todayStr()));
  const [budget, setBudget] = useState(20000);
  const [showAdd, setShowAdd] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [filterCat, setFilterCat] = useState(null);
  const [filterMethod, setFilterMethod] = useState(null);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    amount: "", category: "Food", method: "UPI", upiApp: "Google Pay", date: todayStr(), note: "",
  });

  const monthTxns = useMemo(
    () => txns.filter((t) => monthKey(t.date) === month
      && (!filterCat || t.category === filterCat)
      && (!filterMethod || t.method === filterMethod)),
    [txns, month, filterCat, filterMethod]
  );

  const total = monthTxns.reduce((s, t) => s + Number(t.amount), 0);
  const remaining = budget - total;
  const pct = Math.min(100, Math.round((total / budget) * 100)) || 0;

  const byCategory = useMemo(() => {
    const map = {};
    monthTxns.forEach((t) => { map[t.category] = (map[t.category] || 0) + Number(t.amount); });
    return CATEGORIES.map((c) => ({ name: c.name, value: map[c.name] || 0, color: c.color })).filter((c) => c.value > 0);
  }, [monthTxns]);

  const byMethod = useMemo(() => {
    const map = {};
    monthTxns.forEach((t) => { map[t.method] = (map[t.method] || 0) + Number(t.amount); });
    return METHODS.map((m) => ({ name: m.name, value: map[m.name] || 0 })).filter((m) => m.value > 0);
  }, [monthTxns]);

  const grouped = useMemo(() => {
    const map = {};
    [...monthTxns].sort((a, b) => b.date.localeCompare(a.date)).forEach((t) => {
      (map[t.date] = map[t.date] || []).push(t);
    });
    return Object.entries(map);
  }, [monthTxns]);

  function resetForm() {
    setForm({ amount: "", category: "Food", method: "UPI", upiApp: "Google Pay", date: todayStr(), note: "" });
    setEditId(null);
  }

  function saveTxn() {
    if (!form.amount || Number(form.amount) <= 0) return;
    if (editId) {
      setTxns(txns.map((t) => (t.id === editId ? { ...form, id: editId, amount: Number(form.amount) } : t)));
    } else {
      setTxns([...txns, { ...form, id: Date.now().toString(), amount: Number(form.amount) }]);
    }
    setShowAdd(false);
    resetForm();
  }

  function startEdit(t) {
    setForm({ amount: t.amount, category: t.category, method: t.method, upiApp: t.upiApp || "Google Pay", date: t.date, note: t.note || "" });
    setEditId(t.id);
    setShowAdd(true);
  }

  function deleteTxn(id) {
    setTxns(txns.filter((t) => t.id !== id));
  }

  const monthLabel = new Date(month + "-02").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#10221F", minHeight: "100vh", padding: "0 0 40px", maxWidth: 480, margin: "0 auto", color: "#F6F4EC" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .serif { font-family: 'Fraunces', serif; }
        button { font-family: inherit; }
        .chip { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid #33504B; cursor: pointer; background: transparent; color: #C9CFC9; white-space: nowrap; }
        .chip.active { background: #D9A02D; color: #16332F; border-color: #D9A02D; }
        input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #D8D4C4; background: #FFFEF9; font-size: 14px; color: #16332F; font-family: inherit; }
        label { font-size: 12px; font-weight: 600; color: #6B6A60; margin-bottom: 4px; display: block; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 20px 20px", background: "linear-gradient(180deg,#16332F,#10221F)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={20} color="#D9A02D" />
            <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>My Khata</span>
          </div>
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: "auto", background: "#1B3B36", color: "#F6F4EC", border: "1px solid #33504B", fontSize: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              const key = d.toISOString().slice(0, 7);
              return <option key={key} value={key}>{d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</option>;
            })}
          </select>
        </div>

        <p style={{ fontSize: 12, color: "#9BA89F", margin: "0 0 4px" }}>Spent in {monthLabel}</p>
        <div className="mono" style={{ fontSize: 34, fontWeight: 600, marginBottom: 14 }}>{fmt(total)}</div>

        <div style={{ background: "#1B3B36", borderRadius: 10, height: 8, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#B33F2B" : pct > 80 ? "#D9A02D" : "#4F9E85", transition: "width .3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9BA89F" }}>
          <span>{pct}% of budget</span>
          <span onClick={() => setShowBudget(true)} style={{ cursor: "pointer", color: "#D9A02D" }}>
            Budget {fmt(budget)} · edit
          </span>
        </div>
        {remaining < 0 && (
          <p style={{ color: "#F0997B", fontSize: 12, marginTop: 8 }}>Over budget by {fmt(Math.abs(remaining))}</p>
        )}
      </div>

      {/* Charts */}
      {byCategory.length > 0 && (
        <div style={{ padding: "20px 20px 0" }}>
          <h4 className="serif" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>Where it went</h4>
          <div style={{ background: "#16332F", borderRadius: 16, padding: "12px 8px", display: "flex", alignItems: "center" }}>
            <div style={{ width: 130, height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" innerRadius={38} outerRadius={60} paddingAngle={2}>
                    {byCategory.map((c, i) => <Cell key={i} fill={c.color} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "#16332F", border: "1px solid #33504B", borderRadius: 8, color: "#F6F4EC", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, paddingRight: 8 }}>
              {byCategory.map((c) => (
                <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#C9CFC9" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: c.color, display: "inline-block" }} />
                    {c.name}
                  </span>
                  <span className="mono" style={{ color: "#F6F4EC" }}>{fmt(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {byMethod.length > 0 && (
        <div style={{ padding: "18px 20px 0" }}>
          <h4 className="serif" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>By payment method</h4>
          <div style={{ background: "#16332F", borderRadius: 16, padding: "14px 8px 4px", height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMethod} margin={{ left: 0, right: 12 }}>
                <CartesianGrid stroke="#25443F" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#9BA89F", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "#16332F", border: "1px solid #33504B", borderRadius: 8, color: "#F6F4EC", fontSize: 12 }} />
                <Bar dataKey="value" fill="#D9A02D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ padding: "20px 20px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        {CATEGORIES.map((c) => (
          <button key={c.name} className={`chip ${filterCat === c.name ? "active" : ""}`} onClick={() => setFilterCat(filterCat === c.name ? null : c.name)}>{c.name}</button>
        ))}
      </div>
      <div style={{ padding: "10px 20px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        {METHODS.map((m) => (
          <button key={m.name} className={`chip ${filterMethod === m.name ? "active" : ""}`} onClick={() => setFilterMethod(filterMethod === m.name ? null : m.name)}>{m.name}</button>
        ))}
      </div>

      {/* Passbook ledger */}
      <div style={{ padding: "18px 20px 100px" }}>
        <h4 className="serif" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>Passbook</h4>
        {grouped.length === 0 && (
          <p style={{ color: "#8A9791", fontSize: 13, textAlign: "center", padding: "30px 0" }}>No entries yet. Tap + to add one.</p>
        )}
        {grouped.map(([date, items]) => (
          <div key={date} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: "#7F8C86", margin: "0 0 6px", fontWeight: 600 }}>
              {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <div style={{ background: "#16332F", borderRadius: 14, overflow: "hidden" }}>
              {items.map((t, i) => {
                const cat = CATEGORIES.find((c) => c.name === t.category);
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderTop: i ? "1px solid #23433D" : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: (cat?.color || "#888") + "33", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cat?.color }}>{t.category.slice(0, 2)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.note || t.category}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#8A9791" }}>{t.method}{t.method === "UPI" && t.upiApp ? ` · ${t.upiApp}` : ""}</p>
                    </div>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: "#F0997B" }}>-{fmt(t.amount)}</span>
                    <button onClick={() => startEdit(t)} style={{ background: "none", border: "none", color: "#7F8C86", cursor: "pointer", padding: 2 }}><Pencil size={14} /></button>
                    <button onClick={() => deleteTxn(t.id)} style={{ background: "none", border: "none", color: "#7F8C86", cursor: "pointer", padding: 2 }}><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => { resetForm(); setShowAdd(true); }}
        style={{ position: "fixed", bottom: 24, right: "calc(50% - 220px)", width: 56, height: 56, borderRadius: 28, background: "#D9A02D", border: "none", color: "#16332F", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
      >
        <Plus size={26} />
      </button>

      {showAdd && (
        <Modal title={editId ? "Edit entry" : "Add expense"} onClose={() => { setShowAdd(false); resetForm(); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label>Amount</label>
              <div style={{ position: "relative" }}>
                <IndianRupee size={14} style={{ position: "absolute", left: 12, top: 13, color: "#8A8578" }} />
                <input type="number" style={{ paddingLeft: 30 }} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div>
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label>Payment method</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {METHODS.map((m) => <option key={m.name}>{m.name}</option>)}
              </select>
            </div>
            {form.method === "UPI" && (
              <div>
                <label>UPI app</label>
                <select value={form.upiApp} onChange={(e) => setForm({ ...form, upiApp: e.target.value })}>
                  {UPI_APPS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            )}
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label>Note</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Lunch with team" />
            </div>
            <button onClick={saveTxn} style={{ marginTop: 6, background: "#16332F", color: "#F6F4EC", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, cursor: "pointer" }}>
              {editId ? "Save changes" : "Add entry"}
            </button>
          </div>
        </Modal>
      )}

      {showBudget && (
        <Modal title="Set monthly budget" onClose={() => setShowBudget(false)}>
          <label>Budget amount</label>
          <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} />
          <button onClick={() => setShowBudget(false)} style={{ marginTop: 14, background: "#16332F", color: "#F6F4EC", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Save budget
          </button>
        </Modal>
      )}
    </div>
  );
}
