import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, StyleSheet, ScrollView, Alert, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PieChart, BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const STORAGE_KEY = "@expenses_v1";
const BUDGET_KEY = "@budget_v1";
const screenWidth = Dimensions.get("window").width - 32;

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

const METHODS = ["UPI", "Cash", "Card", "Net Banking", "Other"];
const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM", "Other UPI"];

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKey = (d) => d.slice(0, 7);
const fmt = (n) => "\u20B9" + Number(n || 0).toLocaleString("en-IN");

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(20000);
  const [month, setMonth] = useState(monthKey(todayStr()));
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    amount: "", category: "Food", method: "UPI", upiApp: "Google Pay",
    date: todayStr(), note: "",
  });

  // Load from storage on first launch
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setExpenses(JSON.parse(raw));
        const b = await AsyncStorage.getItem(BUDGET_KEY);
        if (b) setBudget(Number(b));
      } catch (e) {
        console.warn("Failed to load data", e);
      }
    })();
  }, []);

  // Persist every time expenses change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)).catch(() => {});
  }, [expenses]);

  useEffect(() => {
    AsyncStorage.setItem(BUDGET_KEY, String(budget)).catch(() => {});
  }, [budget]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => monthKey(e.date) === month),
    [expenses, month]
  );

  const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const pct = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  const byCategory = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return CATEGORIES
      .map((c) => ({ name: c.name, amount: map[c.name] || 0, color: c.color, legendFontColor: "#F6F4EC", legendFontSize: 12 }))
      .filter((c) => c.amount > 0);
  }, [monthExpenses]);

  const byMethod = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => { map[e.method] = (map[e.method] || 0) + Number(e.amount); });
    return METHODS.filter((m) => map[m]).map((m) => ({ label: m, value: map[m] }));
  }, [monthExpenses]);

  function resetForm() {
    setForm({ amount: "", category: "Food", method: "UPI", upiApp: "Google Pay", date: todayStr(), note: "" });
    setEditId(null);
  }

  function saveExpense() {
    if (!form.amount || Number(form.amount) <= 0) {
      Alert.alert("Enter a valid amount");
      return;
    }
    if (editId) {
      setExpenses((prev) => prev.map((e) => (e.id === editId ? { ...form, id: editId, amount: Number(form.amount) } : e)));
    } else {
      setExpenses((prev) => [...prev, { ...form, id: Date.now().toString(), amount: Number(form.amount) }]);
    }
    setModalVisible(false);
    resetForm();
  }

  function deleteExpense(id) {
    Alert.alert("Delete entry", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setExpenses((prev) => prev.filter((e) => e.id !== id)) },
    ]);
  }

  function startEdit(item) {
    setForm({ amount: String(item.amount), category: item.category, method: item.method, upiApp: item.upiApp || "Google Pay", date: item.date, note: item.note || "" });
    setEditId(item.id);
    setModalVisible(true);
  }

  const sorted = [...monthExpenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <Text style={styles.title}>My Khata</Text>
          <Text style={styles.subtitle}>Spent this month</Text>
          <Text style={styles.totalAmount}>{fmt(total)}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? "#B33F2B" : pct > 80 ? "#D9A02D" : "#4F9E85" }]} />
          </View>
          <Text style={styles.budgetLabel}>{pct}% of {fmt(budget)} budget</Text>
        </View>

        {byCategory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Where it went</Text>
            <PieChart
              data={byCategory}
              width={screenWidth}
              height={180}
              chartConfig={{ color: () => "#F6F4EC" }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="8"
              hasLegend={true}
            />
          </View>
        )}

        {byMethod.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>By payment method</Text>
            <BarChart
              data={{
                labels: byMethod.map((m) => m.label),
                datasets: [{ data: byMethod.map((m) => m.value) }],
              }}
              width={screenWidth}
              height={180}
              fromZero
              chartConfig={{
                backgroundGradientFrom: "#16332F",
                backgroundGradientTo: "#16332F",
                color: () => "#D9A02D",
                labelColor: () => "#C9CFC9",
                barPercentage: 0.6,
                decimalPlaces: 0,
              }}
              style={{ borderRadius: 12 }}
            />
          </View>
        )}

        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={styles.cardTitle}>Passbook</Text>
          {sorted.length === 0 && <Text style={styles.emptyText}>No entries yet. Tap + to add one.</Text>}
          <FlatList
            data={sorted}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const cat = CATEGORIES.find((c) => c.name === item.category);
              return (
                <View style={styles.row}>
                  <View style={[styles.catBadge, { backgroundColor: (cat?.color || "#888") + "33" }]}>
                    <Text style={{ color: cat?.color, fontWeight: "700", fontSize: 11 }}>{item.category.slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.note || item.category}</Text>
                    <Text style={styles.rowSub}>
                      {item.date} · {item.method}{item.method === "UPI" && item.upiApp ? ` (${item.upiApp})` : ""}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>-{fmt(item.amount)}</Text>
                  <TouchableOpacity onPress={() => startEdit(item)} style={{ padding: 6 }}>
                    <Text style={{ color: "#9BA89F" }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteExpense(item.id)} style={{ padding: 6 }}>
                    <Text style={{ color: "#F0997B" }}>Del</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Text style={{ color: "#16332F", fontSize: 28, fontWeight: "700" }}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <ScrollView>
              <Text style={styles.modalTitle}>{editId ? "Edit entry" : "Add expense"}</Text>

              <Text style={styles.label}>Amount</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.amount}
                onChangeText={(t) => setForm({ ...form, amount: t })} placeholder="0" />

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.name} style={[styles.chip, form.category === c.name && styles.chipActive]}
                    onPress={() => setForm({ ...form, category: c.name })}>
                    <Text style={[styles.chipText, form.category === c.name && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Payment method</Text>
              <View style={styles.chipRow}>
                {METHODS.map((m) => (
                  <TouchableOpacity key={m} style={[styles.chip, form.method === m && styles.chipActive]}
                    onPress={() => setForm({ ...form, method: m })}>
                    <Text style={[styles.chipText, form.method === m && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.method === "UPI" && (
                <>
                  <Text style={styles.label}>UPI app</Text>
                  <View style={styles.chipRow}>
                    {UPI_APPS.map((a) => (
                      <TouchableOpacity key={a} style={[styles.chip, form.upiApp === a && styles.chipActive]}
                        onPress={() => setForm({ ...form, upiApp: a })}>
                        <Text style={[styles.chipText, form.upiApp === a && styles.chipTextActive]}>{a}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={form.date} onChangeText={(t) => setForm({ ...form, date: t })} />

              <Text style={styles.label}>Note</Text>
              <TextInput style={styles.input} value={form.note} onChangeText={(t) => setForm({ ...form, note: t })} placeholder="e.g. Lunch with team" />

              <TouchableOpacity style={styles.saveBtn} onPress={saveExpense}>
                <Text style={styles.saveBtnText}>{editId ? "Save changes" : "Add entry"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={{ color: "#8A8578" }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#10221F" },
  header: { padding: 20, backgroundColor: "#16332F" },
  title: { color: "#D9A02D", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#9BA89F", fontSize: 12, marginTop: 10 },
  totalAmount: { color: "#F6F4EC", fontSize: 32, fontWeight: "700", marginVertical: 6 },
  progressTrack: { height: 8, backgroundColor: "#1B3B36", borderRadius: 8, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%" },
  budgetLabel: { color: "#9BA89F", fontSize: 12, marginTop: 6 },
  card: { margin: 16, marginBottom: 0, backgroundColor: "#16332F", borderRadius: 14, padding: 12 },
  cardTitle: { color: "#F6F4EC", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  emptyText: { color: "#8A9791", textAlign: "center", paddingVertical: 24 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#16332F", padding: 12, borderRadius: 12, marginBottom: 8 },
  catBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowTitle: { color: "#F6F4EC", fontSize: 13, fontWeight: "500" },
  rowSub: { color: "#8A9791", fontSize: 11, marginTop: 2 },
  rowAmount: { color: "#F0997B", fontWeight: "700", fontSize: 13, marginRight: 4 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#D9A02D", alignItems: "center", justifyContent: "center", elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,30,28,0.6)", justifyContent: "flex-end" },
  modalBody: { backgroundColor: "#F6F4EC", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "88%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#16332F", marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#6B6A60", marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#D8D4C4", borderRadius: 10, padding: 10, fontSize: 14, backgroundColor: "#FFFEF9", color: "#16332F" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#D8D4C4", marginRight: 6, marginBottom: 6 },
  chipActive: { backgroundColor: "#D9A02D", borderColor: "#D9A02D" },
  chipText: { fontSize: 12, color: "#6B6A60" },
  chipTextActive: { color: "#16332F", fontWeight: "600" },
  saveBtn: { backgroundColor: "#16332F", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 18 },
  saveBtnText: { color: "#F6F4EC", fontWeight: "700" },
  cancelBtn: { alignItems: "center", padding: 10 },
});
