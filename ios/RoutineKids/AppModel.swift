import Foundation
import Observation

@MainActor
@Observable
final class AppModel {
    enum Phase { case loading, signedOut, ready }

    var phase: Phase = .loading
    var envelope: HouseholdEnvelope?
    var selectedProfileId: String?
    var selectedPeriod = "MORNING"
    var completedTaskIds = Set<String>()
    var errorMessage: String?
    var authNotice: String?
    var isWorking = false
    var isOffline = false

    let deviceId: String
    private let api = APIClient.shared
    private let offlineStore: OfflineMutationStore
    private let envelopeStore: HouseholdEnvelopeStore
    private var pendingMutations: [CompletionMutation]

    static var isRunningUITests: Bool {
#if DEBUG
        ProcessInfo.processInfo.arguments.contains("-routinekids-ui-testing")
#else
        false
#endif
    }

    init(defaults: UserDefaults = .standard) {
        if let stored = defaults.string(forKey: "routinekids.device-id") {
            deviceId = stored
        } else {
            let created = UUID().uuidString.lowercased()
            defaults.set(created, forKey: "routinekids.device-id")
            deviceId = created
        }
        offlineStore = OfflineMutationStore(defaults: defaults)
        envelopeStore = HouseholdEnvelopeStore(defaults: defaults)
        pendingMutations = offlineStore.load()

#if DEBUG
        if Self.isRunningUITests {
            offlineStore.clear()
            envelopeStore.clear()

            if ProcessInfo.processInfo.arguments.contains("-routinekids-ui-testing-board") {
                let fixture = Self.uiTestEnvelope
                envelope = fixture
                selectedProfileId = fixture.household.childProfiles.first?.id
                completedTaskIds = Set(
                    fixture.completions
                        .filter { $0.childProfileId == selectedProfileId }
                        .map(\.taskId)
                )
                phase = .ready
            } else {
                phase = .signedOut
            }
            return
        }
#endif

        if let cachedEnvelope = envelopeStore.load() {
            envelope = cachedEnvelope
            selectedProfileId = cachedEnvelope.household.childProfiles.first?.id
            completedTaskIds = Set(
                cachedEnvelope.completions
                    .filter { $0.childProfileId == selectedProfileId }
                    .map(\.taskId)
            )
            phase = .ready
            isOffline = true
        }
    }

    var selectedProfile: ChildProfile? {
        guard let profiles = envelope?.household.childProfiles else { return nil }
        return profiles.first(where: { $0.id == selectedProfileId }) ?? profiles.first
    }

    var visibleRoutine: Routine? {
        selectedProfile?.routines.first(where: { $0.period == selectedPeriod })
    }

    func restoreSession() async {
        do {
            try await refresh()
        } catch let error as APIError where error.error == "unauthorized" {
            envelopeStore.clear()
            envelope = nil
            phase = .signedOut
        } catch {
            errorMessage = error.localizedDescription
            isOffline = true
            phase = envelope == nil ? .signedOut : .ready
        }
    }

    func signIn(email: String, password: String) async {
        isWorking = true
        errorMessage = nil
        authNotice = nil
        defer { isWorking = false }
        do {
            try await api.signIn(email: email, password: password)
            try await refresh()
        } catch {
            errorMessage = String(localized: "auth.signin.error")
        }
    }

    func signUp(name: String, email: String, password: String) async {
        isWorking = true
        errorMessage = nil
        authNotice = nil
        defer { isWorking = false }

        do {
            try await api.signUp(name: name, email: email, password: password)
            do {
                try await refresh()
            } catch {
                phase = .signedOut
                authNotice = String(localized: "auth.signup.verify")
            }
        } catch {
            errorMessage = String(localized: "auth.signup.error")
        }
    }

    func requestPasswordReset(email: String) async {
        authNotice = String(localized: "auth.reset.sent")
        try? await api.requestPasswordReset(email: email)
    }

    func signOut() async {
        try? await api.signOut()
        envelope = nil
        completedTaskIds = []
        authNotice = nil
        offlineStore.clear()
        envelopeStore.clear()
        isOffline = false
        phase = .signedOut
    }

    func deleteAccount(householdName: String) async -> Bool {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            try await api.deleteAccount(householdName: householdName)
            await signOut()
            return true
        } catch let error as APIError {
            errorMessage = error.error.replacingOccurrences(of: "_", with: " ")
            return false
        } catch {
            errorMessage = String(localized: "account.delete.error")
            return false
        }
    }

    func createProfile(
        name: String,
        age: Int,
        avatar: String,
        headline: String?,
        photoDataURL: String? = nil
    ) async -> Bool {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            try await api.createProfile(
                name: name,
                age: age,
                avatar: avatar,
                headline: headline,
                photoDataURL: photoDataURL
            )
            try await refresh()
            selectedProfileId = envelope?.household.childProfiles.last?.id
            return true
        } catch let error as APIError {
            errorMessage = error.error.replacingOccurrences(of: "_", with: " ")
            return false
        } catch {
            errorMessage = String(localized: "profile.create.error")
            return false
        }
    }

    func updateProfile(
        id: String,
        name: String,
        age: Int,
        avatar: String,
        headline: String?,
        photoDataURL: String?,
        removePhoto: Bool = false
    ) async -> Bool {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            try await api.updateProfile(id: id, name: name, age: age, avatar: avatar, headline: headline)
            if let photoDataURL {
                try await api.updateProfilePhoto(id: id, dataURL: photoDataURL)
            } else if removePhoto {
                try await api.removeProfilePhoto(id: id)
            }
            try await refresh()
            selectedProfileId = id
            return true
        } catch let error as APIError {
            errorMessage = error.error.replacingOccurrences(of: "_", with: " ")
            return false
        } catch {
            errorMessage = String(localized: "profile.update.error")
            return false
        }
    }

    func deleteProfile(id: String) async -> Bool {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            try await api.deleteProfile(id: id)
            selectedProfileId = nil
            try await refresh()
            return true
        } catch {
            errorMessage = String(localized: "profile.delete.error")
            return false
        }
    }

    func removeProfilePhoto(id: String) async -> Bool {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await api.removeProfilePhoto(id: id)
            try await refresh()
            return true
        } catch {
            errorMessage = String(localized: "profile.photo.delete.error")
            return false
        }
    }

    func updateHousehold(
        name: String,
        locale: String,
        timeZone: String,
        soundsEnabled: Bool,
        morningStart: String,
        morningEnd: String,
        eveningStart: String,
        eveningEnd: String
    ) async -> Bool {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await api.updateHousehold(
                name: name,
                locale: locale,
                timeZone: timeZone,
                soundsEnabled: soundsEnabled,
                morningStart: morningStart,
                morningEnd: morningEnd,
                eveningStart: eveningStart,
                eveningEnd: eveningEnd
            )
            try await refresh()
            return true
        } catch {
            errorMessage = String(localized: "household.update.error")
            return false
        }
    }

    func refresh() async throws {
        let previousEnvelope = envelope
        let previousProfileId = selectedProfileId
        let previousCompletedTaskIds = completedTaskIds
        if previousEnvelope == nil { phase = .loading }

        do {
            let response = try await api.loadHousehold()
            envelope = response
            selectedProfileId = previousProfileId ?? response.household.childProfiles.first?.id
            completedTaskIds = Set(
                response.completions
                    .filter { $0.childProfileId == selectedProfile?.id }
                    .map(\.taskId)
            )
            envelopeStore.save(response)
            errorMessage = nil
            isOffline = false
            phase = .ready
            await flushPendingMutations()
        } catch {
            envelope = previousEnvelope
            selectedProfileId = previousProfileId
            completedTaskIds = previousCompletedTaskIds
            isOffline = true
            phase = previousEnvelope == nil ? .signedOut : .ready
            throw error
        }
    }

    func selectProfile(_ profile: ChildProfile) {
        selectedProfileId = profile.id
        guard let envelope else { return }
        completedTaskIds = Set(
            envelope.completions
                .filter { $0.childProfileId == profile.id }
                .map(\.taskId)
        )
    }

    func toggle(task: RoutineTask) async {
        guard let profile = selectedProfile, let dayKey = envelope?.dayKey else { return }
        await toggle(task: task, profile: profile, dayKey: dayKey)
    }

    func toggle(task: RoutineTask, profile: ChildProfile) async {
        guard let dayKey = envelope?.dayKey else { return }
        selectProfile(profile)
        await toggle(task: task, profile: profile, dayKey: dayKey)
    }

    private func toggle(task: RoutineTask, profile: ChildProfile, dayKey: String) async {
        let completed = !completedTaskIds.contains(task.id)
        if completed { completedTaskIds.insert(task.id) } else { completedTaskIds.remove(task.id) }

        let mutation = CompletionMutation(
            mutationId: UUID().uuidString.lowercased(),
            deviceId: deviceId,
            childProfileId: profile.id,
            taskId: task.id,
            dayKey: dayKey,
            completed: completed
        )
        pendingMutations.append(mutation)
        offlineStore.save(pendingMutations)
        await flushPendingMutations()
    }

    func flushPendingMutations() async {
        while let mutation = pendingMutations.first {
            do {
                try await api.apply(mutation)
                pendingMutations.removeFirst()
                offlineStore.save(pendingMutations)
            } catch {
                return
            }
        }
    }
}

#if DEBUG
private extension AppModel {
    static var uiTestEnvelope: HouseholdEnvelope {
        let morningTasks = [
            RoutineTask(
                id: "ui-brush-teeth",
                title: "Se brosser les dents",
                shortLabel: "Dents",
                icon: "brush",
                imageUrl: nil,
                color: "#22d3ee",
                durationMinutes: 3,
                scheduleDays: Array(0...6),
                points: 1
            ),
            RoutineTask(
                id: "ui-get-dressed",
                title: "S’habiller",
                shortLabel: "Habits",
                icon: "sparkles",
                imageUrl: nil,
                color: "#fb7185",
                durationMinutes: 5,
                scheduleDays: Array(0...6),
                points: 1
            ),
        ]
        let eveningTasks = [
            RoutineTask(
                id: "ui-read-book",
                title: "Lire une histoire",
                shortLabel: "Histoire",
                icon: "book-open",
                imageUrl: nil,
                color: "#818cf8",
                durationMinutes: 10,
                scheduleDays: Array(0...6),
                points: 1
            ),
        ]
        let routines = [
            Routine(id: "ui-morning", title: "Décollage du matin", period: "MORNING", tasks: morningTasks),
            Routine(id: "ui-evening", title: "Retour sur Terre", period: "EVENING", tasks: eveningTasks),
        ]

        return HouseholdEnvelope(
            apiVersion: 1,
            serverTime: "2026-08-17T17:00:00Z",
            dayKey: "2026-08-17",
            appAccountToken: "00000000-0000-0000-0000-000000000001",
            parentGate: ParentGate(pinConfigured: true),
            household: Household(
                id: "ui-household",
                name: "Équipage RoutineKids",
                locale: "fr",
                timeZone: "Europe/Paris",
                soundsEnabled: true,
                morningStart: "06:30",
                morningEnd: "09:00",
                eveningStart: "17:30",
                eveningEnd: "21:00",
                subscription: nil,
                childProfiles: [
                    ChildProfile(
                        id: "ui-luna",
                        name: "Luna",
                        age: 6,
                        avatar: "👩‍🚀",
                        photoUrl: nil,
                        headline: "Cap sur les étoiles",
                        routines: routines
                    ),
                    ChildProfile(
                        id: "ui-noah",
                        name: "Noah",
                        age: 8,
                        avatar: "🧑‍🚀",
                        photoUrl: nil,
                        headline: "Commandant de bord",
                        routines: routines.map {
                            Routine(
                                id: "noah-\($0.id)",
                                title: $0.title,
                                period: $0.period,
                                tasks: $0.tasks.map {
                                    RoutineTask(
                                        id: "noah-\($0.id)",
                                        title: $0.title,
                                        shortLabel: $0.shortLabel,
                                        icon: $0.icon,
                                        imageUrl: nil,
                                        color: $0.color,
                                        durationMinutes: $0.durationMinutes,
                                        scheduleDays: $0.scheduleDays,
                                        points: $0.points
                                    )
                                }
                            )
                        }
                    ),
                ]
            ),
            completions: [
                TaskCompletion(
                    taskId: "ui-brush-teeth",
                    childProfileId: "ui-luna",
                    completedAt: "2026-08-17T07:00:00Z"
                ),
            ]
        )
    }
}
#endif
