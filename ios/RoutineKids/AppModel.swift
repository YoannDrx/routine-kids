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
            errorMessage = "Connexion impossible. Vérifiez vos identifiants."
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
                authNotice = "Compte créé. Consultez votre e-mail pour confirmer votre adresse."
            }
        } catch {
            errorMessage = "Création impossible. Vérifiez les informations saisies."
        }
    }

    func requestPasswordReset(email: String) async {
        authNotice = "Si cette adresse existe, un lien de réinitialisation vient d’être envoyé."
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
            errorMessage = "La suppression du compte a échoué. Réessayez plus tard."
            return false
        }
    }

    func createProfile(name: String, age: Int, avatar: String, headline: String?) async -> Bool {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            try await api.createProfile(name: name, age: age, avatar: avatar, headline: headline)
            try await refresh()
            selectedProfileId = envelope?.household.childProfiles.last?.id
            return true
        } catch let error as APIError {
            errorMessage = error.error.replacingOccurrences(of: "_", with: " ")
            return false
        } catch {
            errorMessage = "Le profil n’a pas pu être créé. Réessayez."
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
