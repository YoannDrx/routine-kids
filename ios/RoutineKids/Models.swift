import Foundation

struct HouseholdEnvelope: Codable, Sendable {
    let apiVersion: Int
    let serverTime: String
    let dayKey: String
    let appAccountToken: String?
    let parentGate: ParentGate
    let household: Household
    let completions: [TaskCompletion]
}

struct ParentGate: Codable, Sendable {
    let pinConfigured: Bool
}

struct Household: Codable, Sendable {
    let id: String
    let name: String
    let locale: String
    let timeZone: String
    let soundsEnabled: Bool
    let morningStart: String
    let morningEnd: String
    let eveningStart: String
    let eveningEnd: String
    let subscription: Subscription?
    let childProfiles: [ChildProfile]
}

struct Subscription: Codable, Sendable {
    let plan: String
    let status: String?
    let provider: String
    let environment: String
    let periodEnd: String?
    let revokedAt: String?

    var isPremium: Bool {
        guard
            plan == "FAMILY_PLUS",
            ["ACTIVE", "TRIALING"].contains(status),
            ["STRIPE", "APPLE"].contains(provider),
            revokedAt == nil,
            provider != "STRIPE" || environment == "PRODUCTION"
        else { return false }

        guard let periodEnd else { return true }
        return ISO8601DateFormatter().date(from: periodEnd).map { $0 > .now } ?? false
    }
}

struct ChildProfile: Codable, Identifiable, Sendable {
    let id: String
    let name: String
    let age: Int
    let avatar: String?
    let photoUrl: String?
    let headline: String?
    let routines: [Routine]
}

struct Routine: Codable, Identifiable, Sendable {
    let id: String
    let title: String
    let period: String
    let tasks: [RoutineTask]
}

struct RoutineTask: Codable, Identifiable, Sendable {
    let id: String
    let title: String
    let shortLabel: String?
    let icon: String?
    let imageUrl: String?
    let color: String?
    let durationMinutes: Int?
    let scheduleDays: [Int]?
    let points: Int
}

struct TaskCompletion: Codable, Sendable {
    let taskId: String
    let childProfileId: String
    let completedAt: String
}

struct CompletionMutation: Codable, Identifiable, Sendable {
    let mutationId: String
    let deviceId: String
    let childProfileId: String
    let taskId: String
    let dayKey: String
    let completed: Bool

    var id: String { mutationId }
}

struct TemplateEnvelope: Codable, Sendable {
    let templates: [TaskTemplateSummary]
}

struct TaskTemplateSummary: Codable, Identifiable, Sendable {
    let id: String
    let title: String
    let shortLabel: String?
    let icon: String?
    let imageUrl: String?
    let color: String?
    let durationMinutes: Int?
    let isBuiltIn: Bool
}

struct APIError: Codable, Error, LocalizedError, Sendable {
    let error: String

    var errorDescription: String? { error.replacingOccurrences(of: "_", with: " ") }
}
