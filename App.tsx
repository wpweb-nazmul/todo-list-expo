import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  StatusBar,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

type Filter = "All" | "Active" | "Completed";

const STORAGE_KEY = "@nazmul_todo_tasks";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setTasks(JSON.parse(saved) as Task[]);
      } catch {
        Alert.alert("Oops!", "Could not load saved tasks.");
      } finally {
        setLoaded(true);
      }
    };
    loadTasks();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {
      Alert.alert("Oops!", "Could not save your tasks.");
    });
  }, [tasks, loaded]);

  const addTask = () => {
    const title = input.trim();
    if (!title) {
      Alert.alert("Task required", "Please write a task first.");
      return;
    }

    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks((current) => [newTask, ...current]);
    setInput("");
    Keyboard.dismiss();
  };

  const toggleTask = (id: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    Alert.alert("Delete task?", "This task will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setTasks((current) => current.filter((task) => task.id !== id)),
      },
    ]);
  };

  const clearCompleted = () => {
    setTasks((current) => current.filter((task) => !task.completed));
  };

  const filteredTasks = useMemo(() => {
    if (filter === "Active") return tasks.filter((task) => !task.completed);
    if (filter === "Completed") return tasks.filter((task) => task.completed);
    return tasks;
  }, [tasks, filter]);

  const remaining = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.filter((task) => task.completed).length;

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity
        style={[styles.check, item.completed && styles.checkDone]}
        onPress={() => toggleTask(item.id)}
        accessibilityLabel={item.completed ? "Mark task as active" : "Complete task"}
      >
        {item.completed ? <Text style={styles.checkMark}>✓</Text> : null}
      </TouchableOpacity>

      <TouchableOpacity style={styles.taskTextArea} onPress={() => toggleTask(item.id)}>
        <Text style={[styles.taskTitle, item.completed && styles.taskTitleDone]}>
          {item.title}
        </Text>
        <Text style={styles.taskSubtitle}>
          {item.completed ? "Completed" : "Tap the circle when done"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(item.id)}>
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FB" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR DAILY PLANNER</Text>
            <Text style={styles.heading}>My Todo List</Text>
            <Text style={styles.subtitle}>Small steps. Big progress.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>✓</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{remaining}</Text>
            <Text style={styles.statLabel}>To do</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="What do you need to do?"
            placeholderTextColor="#9AA5B5"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addTask}
            maxLength={140}
          />
          <TouchableOpacity style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonText}>＋ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Your tasks</Text>
          {completedCount > 0 && (
            <TouchableOpacity onPress={clearCompleted}>
              <Text style={styles.clearText}>Clear completed</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filters}>
          {(["All", "Active", "Completed"] as Filter[]).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterButton, filter === item && styles.filterButtonActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{filter === "Completed" ? "🎉" : "📝"}</Text>
              <Text style={styles.emptyTitle}>
                {filter === "Completed" ? "Nothing completed yet" : "Your list is clear"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === "Completed"
                  ? "Finish a task and it will show up here."
                  : "Add your first task above and get started."}
              </Text>
            </View>
          }
        />

        <Text style={styles.footer}>Made with focus & consistency ✨</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  eyebrow: { color: "#718096", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  heading: { color: "#172B4D", fontSize: 32, fontWeight: "800", marginTop: 7 },
  subtitle: { color: "#718096", fontSize: 14, marginTop: 5 },
  headerIcon: {
    width: 54, height: 54, borderRadius: 18, backgroundColor: "#DDF8EF",
    alignItems: "center", justifyContent: "center",
  },
  headerIconText: { color: "#00A878", fontSize: 28, fontWeight: "800" },
  statsCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 20, paddingVertical: 18, paddingHorizontal: 8, marginBottom: 18,
    shadowColor: "#20334D", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  stat: { flex: 1, alignItems: "center" },
  statNumber: { color: "#172B4D", fontSize: 23, fontWeight: "800" },
  statLabel: { color: "#8995A5", fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: "#E8EDF3" },
  inputCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 7, marginBottom: 24,
    borderWidth: 1, borderColor: "#E8EDF3",
  },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, color: "#172B4D", fontSize: 14 },
  addButton: { backgroundColor: "#00A878", paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12 },
  addButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#172B4D", fontSize: 20, fontWeight: "800" },
  clearText: { color: "#00A878", fontSize: 12, fontWeight: "700" },
  filters: { flexDirection: "row", marginTop: 14, marginBottom: 12, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "#E9EEF5" },
  filterButtonActive: { backgroundColor: "#172B4D" },
  filterText: { color: "#718096", fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  listContent: { paddingBottom: 16, flexGrow: 1 },
  taskCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#EDF1F6",
  },
  check: {
    width: 25, height: 25, borderRadius: 8, borderWidth: 2, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  checkDone: { backgroundColor: "#00A878", borderColor: "#00A878" },
  checkMark: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  taskTextArea: { flex: 1 },
  taskTitle: { color: "#26364B", fontSize: 15, fontWeight: "700" },
  taskTitleDone: { color: "#9AA5B5", textDecorationLine: "line-through" },
  taskSubtitle: { color: "#9AA5B5", fontSize: 11, marginTop: 4 },
  deleteButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  deleteText: { color: "#A6B0BE", fontSize: 25, fontWeight: "300" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 45, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 34, marginBottom: 12 },
  emptyTitle: { color: "#26364B", fontSize: 16, fontWeight: "800" },
  emptySubtitle: { color: "#8A96A6", fontSize: 12, textAlign: "center", marginTop: 7, lineHeight: 18 },
  footer: { textAlign: "center", color: "#A0AAB7", fontSize: 11, paddingVertical: 12 },
});
