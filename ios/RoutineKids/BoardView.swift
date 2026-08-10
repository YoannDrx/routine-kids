import SwiftUI

struct BoardView: View {
    @Environment(AppModel.self) private var model
    @State private var settingsPresented = false
    @State private var gatePresented = false
    @State private var gateUnlocked = false

    private var weekday: Int {
        Calendar.current.component(.weekday, from: .now) - 1
    }

    var body: some View {
        @Bindable var model = model

        NavigationStack {
            VStack(spacing: 20) {
                profilePicker

                Picker("Période", selection: $model.selectedPeriod) {
                    Label("Matin", systemImage: "sun.max.fill").tag("MORNING")
                    Label("Soir", systemImage: "moon.stars.fill").tag("EVENING")
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 420)

                if let routine = model.visibleRoutine {
                    Text(routine.title)
                        .font(.system(size: 32, weight: .bold, design: .rounded))

                    ScrollView {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 170), spacing: 16)], spacing: 16) {
                            ForEach(routine.tasks.filter(isScheduledToday)) { task in
                                TaskCard(
                                    task: task,
                                    completed: model.completedTaskIds.contains(task.id)
                                ) {
                                    Task { await model.toggle(task: task) }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .scrollIndicators(.hidden)
                } else {
                    ContentUnavailableView(
                        "Routine vide",
                        systemImage: "sparkles",
                        description: Text("Ajoutez des missions depuis l’espace parent sur le web.")
                    )
                }
            }
            .padding(.top)
            .navigationTitle("RoutineKids")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Réglages", systemImage: "gearshape.fill") {
                        gateUnlocked = false
                        gatePresented = true
                    }
                }
            }
            .sheet(
                isPresented: $gatePresented,
                onDismiss: {
                    if gateUnlocked { settingsPresented = true }
                }
            ) {
                NativeParentalGateView(
                    pinConfigured: model.envelope?.parentGate.pinConfigured == true
                ) {
                    gateUnlocked = true
                    gatePresented = false
                }
            }
            .sheet(isPresented: $settingsPresented) { NativeSettingsView() }
            .refreshable { try? await model.refresh() }
        }
    }

    private var profilePicker: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 12) {
                ForEach(model.envelope?.household.childProfiles ?? []) { profile in
                    Button {
                        model.selectProfile(profile)
                    } label: {
                        HStack(spacing: 8) {
                            Text(profile.avatar ?? "🧑‍🚀")
                            Text(profile.name).fontWeight(.semibold)
                        }
                        .padding(.horizontal, 16)
                        .frame(minHeight: 48)
                        .background(
                            profile.id == model.selectedProfile?.id ? Color.pink : Color.white.opacity(0.08),
                            in: .capsule
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(profile.id == model.selectedProfile?.id ? .isSelected : [])
                }
            }
            .padding(.horizontal)
        }
        .scrollIndicators(.hidden)
    }

    private func isScheduledToday(_ task: RoutineTask) -> Bool {
        task.scheduleDays?.contains(weekday) ?? true
    }
}

private struct TaskCard: View {
    let task: RoutineTask
    let completed: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: completed ? "checkmark.circle.fill" : symbol(for: task.icon))
                    .font(.system(size: 44))
                    .foregroundStyle(completed ? .green : .cyan)
                Text(task.shortLabel ?? task.title)
                    .font(.headline)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, minHeight: 142)
            .padding()
            .background(completed ? Color.green.opacity(0.18) : Color.white.opacity(0.08), in: .rect(cornerRadius: 24))
            .overlay {
                RoundedRectangle(cornerRadius: 24)
                    .stroke(completed ? Color.green : Color.white.opacity(0.1), lineWidth: 2)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(task.title)
        .accessibilityValue(completed ? "Terminée" : "À faire")
        .accessibilityHint("Touchez deux fois pour changer l’état")
    }

    private func symbol(for icon: String?) -> String {
        switch icon {
        case "moon": "moon.stars.fill"
        case "bed": "bed.double.fill"
        case "apple": "apple.logo"
        case "book-open": "book.fill"
        case "school": "backpack.fill"
        case "heart": "heart.fill"
        case "sun": "sun.max.fill"
        case "droplets": "drop.fill"
        case "brush": "paintbrush.fill"
        default: "sparkles"
        }
    }
}
