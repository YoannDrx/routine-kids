import SwiftUI

struct BoardView: View {
    private enum ParentDestination { case settings, onboarding }

    @Environment(AppModel.self) private var model
    @State private var settingsPresented = false
    @State private var gatePresented = false
    @State private var gateUnlocked = false
    @State private var onboardingPresented = false
    @State private var parentDestination = ParentDestination.settings

    private var profiles: [ChildProfile] {
        model.envelope?.household.childProfiles ?? []
    }

    var body: some View {
        @Bindable var model = model

        NavigationStack {
            VStack(spacing: 0) {
                boardHeader

                if model.isOffline {
                    Label("Mode hors ligne · synchronisation en attente", systemImage: "wifi.slash")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.yellow)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .frame(maxWidth: .infinity)
                        .background(Color.yellow.opacity(0.1))
                        .accessibilityLabel("Mode hors ligne, synchronisation en attente")
                }

                ScrollView {
                    LazyVStack(spacing: 10) {
                        if profiles.isEmpty {
                            onboardingCard
                        } else {
                            ForEach(profiles) { profile in
                                FamilyRoutineRow(
                                    profile: profile,
                                    period: model.selectedPeriod,
                                    completions: completedTaskIds(for: profile)
                                ) { task in
                                    Task { await model.toggle(task: task, profile: profile) }
                                } onManage: {
                                    openParentSpace()
                                }
                            }

                            Button {
                                parentDestination = .onboarding
                                gateUnlocked = false
                                gatePresented = true
                            } label: {
                                Label("Ajouter un astronaute", systemImage: "plus")
                                    .font(.subheadline.weight(.bold))
                                    .frame(maxWidth: .infinity, minHeight: 46)
                            }
                            .buttonStyle(.plain)
                            .foregroundStyle(.white.opacity(0.82))
                            .background(Color.white.opacity(0.06), in: .rect(cornerRadius: 15))
                            .overlay {
                                RoundedRectangle(cornerRadius: 15)
                                    .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [5]))
                                    .foregroundStyle(.white.opacity(0.16))
                            }
                        }
                    }
                    .padding(12)
                }
                .scrollIndicators(.hidden)
                .refreshable { try? await model.refresh() }
            }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(
                isPresented: $gatePresented,
                onDismiss: {
                    guard gateUnlocked else { return }
                    switch parentDestination {
                    case .settings: settingsPresented = true
                    case .onboarding: onboardingPresented = true
                    }
                }
            ) {
                NativeParentalGateView(
                    pinConfigured: model.envelope?.parentGate.pinConfigured == true
                ) {
                    gateUnlocked = true
                    gatePresented = false
                }
            }
            .fullScreenCover(isPresented: $settingsPresented) { NativeSettingsView() }
            .sheet(isPresented: $onboardingPresented) { NativeProfileEditorView() }
        }
    }

    private var boardHeader: some View {
        HStack(spacing: 14) {
            HStack(spacing: 7) {
                Image(systemName: "paperplane.fill")
                    .foregroundStyle(.white)
                    .frame(width: 28, height: 28)
                    .background(
                        LinearGradient(colors: [.pink, .orange], startPoint: .topLeading, endPoint: .bottomTrailing),
                        in: .circle
                    )
                Text("Routine") + Text("Kids").foregroundStyle(.orange)
            }
            .font(RoutineTypography.display(size: 17, relativeTo: .headline, weight: .black))

            Spacer()

            TimelineView(.periodic(from: .now, by: 60)) { context in
                Text(context.date.formatted(date: .omitted, time: .shortened))
                    .font(.system(size: 20, weight: .bold, design: .monospaced))
                    .foregroundStyle(.cyan)
                    .shadow(color: .cyan.opacity(0.5), radius: 9)
                    .accessibilityLabel("Heure actuelle")
            }

            Spacer()

            Button {
                model.selectedPeriod = "MORNING"
            } label: {
                Label("Matin", systemImage: "sun.max.fill")
                    .labelStyle(.titleAndIcon)
                    .padding(.horizontal, 12)
                    .frame(minHeight: 38)
                    .background(model.selectedPeriod == "MORNING" ? Color.pink : .clear, in: .capsule)
            }
            .buttonStyle(.plain)

            Button {
                model.selectedPeriod = "EVENING"
            } label: {
                Label("Soir", systemImage: "moon.stars.fill")
                    .labelStyle(.titleAndIcon)
                    .padding(.horizontal, 12)
                    .frame(minHeight: 38)
                    .background(model.selectedPeriod == "EVENING" ? Color.indigo : .clear, in: .capsule)
            }
            .buttonStyle(.plain)

            Button(action: openParentSpace) {
                Image(systemName: "slider.horizontal.3")
                    .frame(width: 40, height: 40)
                    .background(Color.white.opacity(0.08), in: .circle)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Réglages parents")
            .accessibilityIdentifier("parent-settings-button")
        }
        .padding(.horizontal, 16)
        .frame(minHeight: 58)
        .background(Color(red: 0.055, green: 0.035, blue: 0.14).opacity(0.94))
        .overlay(alignment: .bottom) { Divider().overlay(.white.opacity(0.08)) }
    }

    private func openParentSpace() {
        parentDestination = .settings
        gateUnlocked = false
        gatePresented = true
    }

    private func completedTaskIds(for profile: ChildProfile) -> Set<String> {
        if profile.id == model.selectedProfile?.id {
            return model.completedTaskIds
        }
        return Set(
            (model.envelope?.completions ?? [])
                .filter { $0.childProfileId == profile.id }
                .map(\.taskId)
        )
    }

    private var onboardingCard: some View {
        VStack(spacing: 16) {
            Text("🚀").font(.system(size: 58))
            Text("Préparons la première mission")
                .font(RoutineTypography.display(size: 30, relativeTo: .title))
                .multilineTextAlignment(.center)
            Text("Créez le profil de votre enfant. RoutineKids préparera automatiquement les routines du matin et du soir.")
                .foregroundStyle(.white.opacity(0.72))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 520)
            Button {
                parentDestination = .onboarding
                gateUnlocked = false
                gatePresented = true
            } label: {
                Label("Créer le premier profil", systemImage: "person.crop.circle.badge.plus")
                    .font(.headline)
                    .padding(.horizontal, 22)
                    .frame(minHeight: 52)
            }
            .buttonStyle(.borderedProminent)
            .tint(.pink)
        }
        .padding(32)
        .frame(maxWidth: .infinity)
        .background(Color.white.opacity(0.07), in: .rect(cornerRadius: 26))
        .overlay { RoundedRectangle(cornerRadius: 26).stroke(Color.white.opacity(0.12)) }
        .padding(.top, 40)
    }
}

private struct FamilyRoutineRow: View {
    let profile: ChildProfile
    let period: String
    let completions: Set<String>
    let onToggle: (RoutineTask) -> Void
    let onManage: () -> Void

    private var weekday: Int { Calendar.current.component(.weekday, from: .now) - 1 }
    private var routine: Routine? { profile.routines.first { $0.period == period } }
    private var tasks: [RoutineTask] {
        routine?.tasks.filter { $0.scheduleDays?.contains(weekday) ?? true } ?? []
    }
    private var progress: Double {
        guard !tasks.isEmpty else { return 0 }
        return Double(tasks.filter { completions.contains($0.id) }.count) / Double(tasks.count)
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 5) {
                ZStack {
                    Circle().stroke(.white.opacity(0.1), lineWidth: 5)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            LinearGradient(colors: [.pink, .orange], startPoint: .top, endPoint: .bottom),
                            style: StrokeStyle(lineWidth: 5, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                    ProfilePortrait(profile: profile, fontSize: 35)
                        .frame(width: 58, height: 58)
                }
                .frame(width: 70, height: 70)
                Text(profile.name)
                    .font(.caption.weight(.bold))
                    .lineLimit(1)
            }
            .frame(width: 82)

            if tasks.isEmpty {
                Button(action: onManage) {
                    Label("Ajouter des missions", systemImage: "plus")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 82)
                        .background(.white.opacity(0.05), in: .rect(cornerRadius: 18))
                }
                .buttonStyle(.plain)
            } else {
                ScrollView(.horizontal) {
                    HStack(spacing: 9) {
                        ForEach(tasks) { task in
                            CompactTaskCard(
                                task: task,
                                completed: completions.contains(task.id)
                            ) { onToggle(task) }
                        }
                    }
                    .padding(.vertical, 2)
                }
                .scrollIndicators(.hidden)
            }

            Button(action: onManage) {
                Image(systemName: "plus")
                    .font(.headline)
                    .frame(width: 38, height: 38)
                    .background(.white.opacity(0.08), in: .circle)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Gérer les missions de \(profile.name)")
        }
        .padding(10)
        .frame(minHeight: 112)
        .background(.white.opacity(0.055), in: .rect(cornerRadius: 20))
        .overlay { RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.1)) }
    }
}

private struct CompactTaskCard: View {
    let task: RoutineTask
    let completed: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: symbol(for: task.icon))
                        .font(.system(size: 27, weight: .semibold))
                        .foregroundStyle(completed ? .white : .cyan)
                        .frame(width: 54, height: 44)
                    if completed {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .background(.white, in: .circle)
                    }
                }
                Text(task.shortLabel ?? task.title)
                    .font(RoutineTypography.display(size: 10, relativeTo: .caption2, weight: .black))
                    .textCase(.uppercase)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .frame(width: 72)
            }
            .frame(width: 86, height: 88)
            .background(
                completed ? Color.green.opacity(0.2) : Color(red: 0.11, green: 0.08, blue: 0.24),
                in: .rect(cornerRadius: 16)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(completed ? .green.opacity(0.8) : .white.opacity(0.1), lineWidth: 1.5)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(task.title)
        .accessibilityValue(
            completed ? String(localized: "task.completed") : String(localized: "task.pending")
        )
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
