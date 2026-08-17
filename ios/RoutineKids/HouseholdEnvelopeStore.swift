import Foundation

@MainActor
final class HouseholdEnvelopeStore {
    private struct CachedEnvelope: Codable {
        let schemaVersion: Int
        let savedAt: Date
        let envelope: HouseholdEnvelope
    }

    private let defaults: UserDefaults
    private let key = "routinekids.household-envelope.v1"
    private let schemaVersion = 1
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
    }

    func load() -> HouseholdEnvelope? {
        guard
            let data = defaults.data(forKey: key),
            let cached = try? decoder.decode(CachedEnvelope.self, from: data),
            cached.schemaVersion == schemaVersion
        else { return nil }

        return cached.envelope
    }

    func save(_ envelope: HouseholdEnvelope) {
        let cached = CachedEnvelope(
            schemaVersion: schemaVersion,
            savedAt: .now,
            envelope: envelope
        )
        defaults.set(try? encoder.encode(cached), forKey: key)
    }

    func clear() {
        defaults.removeObject(forKey: key)
    }
}
