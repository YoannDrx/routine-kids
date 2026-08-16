import SwiftUI

struct NativeMissionManagerView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var templates: [TaskTemplateSummary] = []
    @State private var selectedProfileId = ""
    @State private var period = "MORNING"
    @State private var routineTitle = ""
    @State private var newTaskTitle = ""
    @State private var newTaskDuration = 5
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
                                ForEach(routine.tasks) { task in
                                    HStack {
                                        Image(systemName: symbol(for: task.icon)).foregroundStyle(.cyan)
                                        Text(task.title)
                                        Spacer()
                                        Button(role: .destructive) {
                                            Task { await delete(task: task) }
                                        } label: {
                                            Image(systemName: "trash")
                                        }
                                        .disabled(isWorking)
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }

                        editorCard(title: "Bibliothèque", icon: "square.grid.2x2.fill", accent: .cyan) {
                            LazyVGrid(columns: [GridItem(.adaptive(minimum: 180), spacing: 10)], spacing: 10) {
                                ForEach(templates) { template in
                                    Button {
                                        Task { await assign(template: template) }
                                    } label: {
                                        HStack {
                                            Image(systemName: symbol(for: template.icon))
                                                .foregroundStyle(.cyan)
                                            VStack(alignment: .leading) {
                                                Text(template.title).fontWeight(.semibold).lineLimit(1)
                                                Text("\(template.durationMinutes ?? 5) min")
                                                    .font(.caption).foregroundStyle(.white.opacity(0.5))
                                            }
                                            Spacer()
                                            Image(systemName: "plus.circle.fill").foregroundStyle(.pink)
                                        }
                                        .padding(11)
                                        .background(.white.opacity(0.06), in: .rect(cornerRadius: 14))
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(isWorking)
                                }
                            }

                            Divider().overlay(.white.opacity(0.1))
                            Text("Créer une mission").font(.headline)
                            HStack {
                                TextField("Nom de la mission", text: $newTaskTitle)
                                    .textFieldStyle(.roundedBorder)
                                Stepper("\(newTaskDuration) min", value: $newTaskDuration, in: 1...120)
                                Button("Créer") { Task { await createTemplate() } }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(newTaskTitle.trimmingCharacters(in: .whitespaces).isEmpty || isWorking)
                            }
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
                period: period
            )
        }
    }

    private func delete(task: RoutineTask) async {
        guard let profile = selectedProfile else { return }
        await perform {
            try await APIClient.shared.deleteRoutineTask(taskId: task.id, childProfileId: profile.id)
        }
    }

    private func createTemplate() async {
        let title = newTaskTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        isWorking = true
        defer { isWorking = false }
        do {
            try await APIClient.shared.createTemplate(
                title: title,
                shortLabel: String(title.prefix(24)),
                icon: "sparkles",
                durationMinutes: newTaskDuration
            )
            newTaskTitle = ""
            await reloadTemplates()
        } catch {
            errorMessage = "La mission n’a pas pu être créée."
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
}
