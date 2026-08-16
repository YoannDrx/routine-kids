import SwiftUI

private let routineWeekdayOrder = [1, 2, 3, 4, 5, 6, 0]

struct NativeMissionManagerView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var templates: [TaskTemplateSummary] = []
    @State private var selectedProfileId = ""
    @State private var period = "MORNING"
    @State private var routineTitle = ""
    @State private var selectedScheduleDays = Set(0...6)
    @State private var templateEditorPresented = false
    @State private var editingTemplate: TaskTemplateSummary?
    @State private var isWorking = false
    @State private var errorMessage: String?

    private var profiles: [ChildProfile] { model.envelope?.household.childProfiles ?? [] }
    private var selectedProfile: ChildProfile? {
        profiles.first { $0.id == selectedProfileId } ?? profiles.first
    }
    private var routine: Routine? {
        selectedProfile?.routines.first { $0.period == period }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.14, green: 0.07, blue: 0.31), Color(red: 0.035, green: 0.02, blue: 0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        HStack {
                            Picker("Astronaute", selection: $selectedProfileId) {
                                ForEach(profiles) { profile in
                                    Text("\(profile.avatar ?? "🧑‍🚀") \(profile.name)").tag(profile.id)
                                }
                            }
                            .pickerStyle(.menu)
                            Spacer()
                            Picker("Période", selection: $period) {
                                Label("Matin", systemImage: "sun.max.fill").tag("MORNING")
                                Label("Soir", systemImage: "moon.stars.fill").tag("EVENING")
                            }
                            .pickerStyle(.segmented)
                            .frame(maxWidth: 300)
                        }

                        editorCard(title: "Routine", icon: "clock.fill", accent: .pink) {
                            HStack {
                                TextField(routine?.title ?? "Nom de la routine", text: $routineTitle)
                                    .textFieldStyle(.roundedBorder)
                                Button("Enregistrer") { Task { await renameRoutine() } }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(routineTitle.trimmingCharacters(in: .whitespaces).isEmpty || isWorking)
                            }

                            if let routine {
                                ForEach(Array(routine.tasks.enumerated()), id: \.element.id) { index, task in
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack {
                                            Image(systemName: symbol(for: task.icon)).foregroundStyle(.cyan)
                                            Text(task.title)
                                            Spacer()
                                            Button {
                                                Task { await move(task: task, offset: -1) }
                                            } label: { Image(systemName: "arrow.up") }
                                            .disabled(index == 0 || isWorking)
                                            Button {
                                                Task { await move(task: task, offset: 1) }
                                            } label: { Image(systemName: "arrow.down") }
                                            .disabled(index == routine.tasks.count - 1 || isWorking)
                                            Button(role: .destructive) {
                                                Task { await delete(task: task) }
                                            } label: {
                                                Image(systemName: "trash")
                                            }
                                            .disabled(isWorking)
                                        }
                                        RoutineTaskDaysEditor(task: task, profileId: selectedProfile?.id ?? "") {
                                            try? await model.refresh()
                                        }
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }

                        editorCard(title: "Bibliothèque", icon: "square.grid.2x2.fill", accent: .cyan) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Jours d’affectation").font(.subheadline.weight(.semibold))
                                schedulePicker(selection: $selectedScheduleDays)
                            }

                            LazyVGrid(columns: [GridItem(.adaptive(minimum: 180), spacing: 10)], spacing: 10) {
                                ForEach(templates) { template in
                                    HStack {
                                        Button {
                                            Task { await assign(template: template) }
                                        } label: {
                                            HStack {
                                                if let url = RoutineKidsMediaURL.resolve(template.imageUrl) {
                                                    AsyncImage(url: url) { phase in
                                                        if let image = phase.image {
                                                            image.resizable().scaledToFill()
                                                        } else {
                                                            Image(systemName: symbol(for: template.icon))
                                                        }
                                                    }
                                                    .frame(width: 34, height: 34)
                                                    .clipShape(.rect(cornerRadius: 9))
                                                } else {
                                            Image(systemName: symbol(for: template.icon))
                                                .foregroundStyle(.cyan)
                                                }
                                            VStack(alignment: .leading) {
                                                Text(template.title).fontWeight(.semibold).lineLimit(1)
                                                Text("\(template.durationMinutes ?? 5) min")
                                                    .font(.caption).foregroundStyle(.white.opacity(0.5))
                                            }
                                            Spacer()
                                            Image(systemName: "plus.circle.fill").foregroundStyle(.pink)
                                            }
                                        }
                                        .buttonStyle(.plain)
                                        .disabled(isWorking)

                                        Button {
                                            editingTemplate = template
                                            templateEditorPresented = true
                                        } label: {
                                            Image(systemName: "pencil")
                                                .frame(width: 34, height: 34)
                                        }
                                        .buttonStyle(.bordered)
                                    }
                                    .padding(11)
                                    .background(.white.opacity(0.06), in: .rect(cornerRadius: 14))
                                }
                            }

                            Divider().overlay(.white.opacity(0.1))
                            Button {
                                editingTemplate = nil
                                templateEditorPresented = true
                            } label: {
                                Label("template.create", systemImage: "plus.circle.fill")
                                    .frame(maxWidth: .infinity, minHeight: 44)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.pink)
                        }

                        if let errorMessage {
                            Text(errorMessage).font(.footnote).foregroundStyle(.red)
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: 920)
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("Planificateur de missions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
            .task { await bootstrap() }
            .onChange(of: selectedProfileId) { _, _ in routineTitle = routine?.title ?? "" }
            .onChange(of: period) { _, _ in routineTitle = routine?.title ?? "" }
            .sheet(isPresented: $templateEditorPresented) {
                NativeTemplateEditorView(template: editingTemplate) {
                    await reloadTemplates()
                    try? await model.refresh()
                }
            }
        }
    }

    private func editorCard<Content: View>(
        title: String,
        icon: String,
        accent: Color,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon).font(.title3.bold()).foregroundStyle(accent)
            content()
        }
        .padding(16)
        .background(.white.opacity(0.065), in: .rect(cornerRadius: 20))
        .overlay { RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.1)) }
    }

    private func bootstrap() async {
        selectedProfileId = selectedProfileId.isEmpty ? (profiles.first?.id ?? "") : selectedProfileId
        routineTitle = routine?.title ?? ""
        await reloadTemplates()
    }

    private func reloadTemplates() async {
        do {
            templates = try await APIClient.shared.loadTemplates().templates
            errorMessage = nil
        } catch {
            errorMessage = "La bibliothèque n’a pas pu être chargée."
        }
    }

    private func renameRoutine() async {
        guard let profile = selectedProfile else { return }
        await perform {
            try await APIClient.shared.renameRoutine(
                childProfileId: profile.id,
                period: period,
                title: routineTitle.trimmingCharacters(in: .whitespacesAndNewlines)
            )
        }
    }

    private func assign(template: TaskTemplateSummary) async {
        guard let profile = selectedProfile else { return }
        await perform {
            try await APIClient.shared.assignTemplate(
                templateId: template.id,
                childProfileId: profile.id,
                period: period,
                scheduleDays: selectedScheduleDays.sorted()
            )
        }
    }

    private func move(task: RoutineTask, offset: Int) async {
        guard let profile = selectedProfile, let routine else { return }
        var ids = routine.tasks.map(\.id)
        guard let index = ids.firstIndex(of: task.id) else { return }
        let destination = index + offset
        guard ids.indices.contains(destination) else { return }
        ids.swapAt(index, destination)
        await perform {
            try await APIClient.shared.reorderRoutineTasks(
                childProfileId: profile.id,
                period: period,
                orderedTaskIds: ids
            )
        }
    }

    private func delete(task: RoutineTask) async {
        guard let profile = selectedProfile else { return }
        await perform {
            try await APIClient.shared.deleteRoutineTask(taskId: task.id, childProfileId: profile.id)
        }
    }

    private func perform(_ operation: () async throws -> Void) async {
        isWorking = true
        defer { isWorking = false }
        do {
            try await operation()
            try await model.refresh()
            routineTitle = routine?.title ?? routineTitle
            errorMessage = nil
        } catch let error as APIError {
            errorMessage = error.error.replacingOccurrences(of: "_", with: " ")
        } catch {
            errorMessage = "La modification n’a pas pu être enregistrée."
        }
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

    private func schedulePicker(selection: Binding<Set<Int>>) -> some View {
        let labels = Calendar.current.veryShortStandaloneWeekdaySymbols
        return HStack(spacing: 7) {
            ForEach(routineWeekdayOrder, id: \.self) { day in
                Button {
                    if selection.wrappedValue.contains(day) {
                        if selection.wrappedValue.count > 1 { selection.wrappedValue.remove(day) }
                    } else {
                        selection.wrappedValue.insert(day)
                    }
                } label: {
                    Text(labels[day].uppercased())
                        .font(.caption2.bold())
                        .frame(width: 30, height: 30)
                        .background(selection.wrappedValue.contains(day) ? Color.pink : Color.white.opacity(0.08), in: .circle)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selection.wrappedValue.contains(day) ? .isSelected : [])
            }
        }
    }
}

private struct RoutineTaskDaysEditor: View {
    let task: RoutineTask
    let profileId: String
    let onSaved: () async -> Void
    @State private var days: Set<Int>
    @State private var isSaving = false

    init(task: RoutineTask, profileId: String, onSaved: @escaping () async -> Void) {
        self.task = task
        self.profileId = profileId
        self.onSaved = onSaved
        _days = State(initialValue: Set(task.scheduleDays ?? Array(0...6)))
    }

    var body: some View {
        HStack(spacing: 6) {
            ForEach(routineWeekdayOrder, id: \.self) { day in
                Button {
                    guard !profileId.isEmpty else { return }
                    if days.contains(day) {
                        guard days.count > 1 else { return }
                        days.remove(day)
                    } else {
                        days.insert(day)
                    }
                    Task { await save() }
                } label: {
                    Text(Calendar.current.veryShortStandaloneWeekdaySymbols[day].uppercased())
                        .font(.caption2.bold())
                        .frame(width: 27, height: 27)
                        .background(days.contains(day) ? Color.cyan.opacity(0.75) : Color.white.opacity(0.06), in: .circle)
                }
                .buttonStyle(.plain)
                .disabled(isSaving)
                .accessibilityAddTraits(days.contains(day) ? .isSelected : [])
            }
        }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }
        do {
            try await APIClient.shared.updateRoutineTaskSchedule(
                taskId: task.id,
                childProfileId: profileId,
                scheduleDays: days.sorted()
            )
            await onSaved()
        } catch {
            days = Set(task.scheduleDays ?? Array(0...6))
        }
    }
}
