import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Habit {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: "1",
      title: "Hacer ejercicio (30 min)",
      completed: false,
      category: "Salud",
    },
    { id: "2", title: "Leer 10 páginas", completed: true, category: "Estudio" },
    { id: "3", title: "Tomar 2L de agua", completed: false, category: "Salud" },
  ]);
  const [newHabit, setNewHabit] = useState("");

  const addHabit = () => {
    if (newHabit.trim() === "") return;
    setHabits([
      ...habits,
      {
        id: Date.now().toString(),
        title: newHabit,
        completed: false,
        category: "General",
      },
    ]);
    setNewHabit("");
  };

  const toggleHabit = (id: string) => {
    setHabits(
      habits.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const progressRatio = habits.length > 0 ? completedCount / habits.length : 0;
  const progressPercentage = Math.round(progressRatio * 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Barra de Racha e Indicadores */}
      <View style={styles.topStatsBar}>
        <View style={styles.statBadge}>
          <Ionicons name="flame" size={20} color="#F97316" />
          <Text style={styles.streakText}>5 días de racha</Text>
        </View>

        <View style={styles.statBadge}>
          <Ionicons name="checkmark-done-circle" size={20} color="#4F46E5" />
          <Text style={styles.completedText}>
            {completedCount}/{habits.length} Listos
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>DailyGoals</Text>
          <Text style={styles.subtitle}>Construye tus hábitos paso a paso</Text>
        </View>

        {/* Tarjeta Principal de Progreso */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>PROGRESO DEL DÍA</Text>
            <Text style={styles.progressPercentText}>
              {progressPercentage}%
            </Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>

          <Text style={styles.progressSubtext}>
            {progressPercentage === 100
              ? "¡Excelente! Completaste todas tus metas de hoy."
              : `Llevas ${completedCount} de ${habits.length} metas completadas.`}
          </Text>
        </View>

        {/* Formulario para agregar nuevo hábito */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Escribe una nueva meta o hábito..."
            placeholderTextColor="#94A3B8"
            value={newHabit}
            onChangeText={setNewHabit}
          />
          <TouchableOpacity
            style={styles.addButton3D}
            onPress={addHabit}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Lista de Hábitos */}
        <Text style={styles.sectionTitle}>MIS OBJETIVOS DE HOY</Text>

        {habits.map((item) => {
          const isDone = item.completed;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.habitCard3D,
                isDone ? styles.habitCompletedCard : styles.habitPendingCard,
              ]}
              onPress={() => toggleHabit(item.id)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.checkbox3D,
                  isDone ? styles.checkboxDone : styles.checkboxPending,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                ) : (
                  <Ionicons name="ellipse-outline" size={18} color="#94A3B8" />
                )}
              </View>

              <View style={styles.habitTextContainer}>
                <Text
                  style={[
                    styles.habitTitle,
                    isDone && styles.habitTitleCompleted,
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={styles.habitCategory}>
                  {item.category.toUpperCase()}
                </Text>
              </View>

              {isDone && (
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>Completado</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topStatsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#F97316",
  },
  completedText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#4F46E5",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderBottomWidth: 4,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  progressPercentText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4F46E5",
  },
  progressBarBackground: {
    height: 14,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 10,
  },
  progressSubtext: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderBottomWidth: 3.5,
  },
  addButton3D: {
    backgroundColor: "#4F46E5",
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 4,
    borderBottomColor: "#3730A3",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  habitCard3D: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  habitPendingCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderBottomWidth: 4,
  },
  habitCompletedCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderBottomWidth: 4,
  },
  checkbox3D: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  checkboxPending: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  checkboxDone: {
    backgroundColor: "#4F46E5",
  },
  habitTextContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  habitTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },
  habitCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 2,
  },
  doneBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
});
