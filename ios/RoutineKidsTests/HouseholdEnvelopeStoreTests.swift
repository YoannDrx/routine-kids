import XCTest
@testable import RoutineKids

@MainActor
final class HouseholdEnvelopeStoreTests: XCTestCase {
    func testPersistsAndClearsTheLastHouseholdEnvelope() throws {
        let suite = "RoutineKidsTests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = HouseholdEnvelopeStore(defaults: defaults)
        let envelope = HouseholdEnvelope(
            apiVersion: 1,
            serverTime: "2026-08-16T12:00:00Z",
            dayKey: "2026-08-16",
            appAccountToken: nil,
            parentGate: ParentGate(pinConfigured: true),
            household: Household(
                id: "household-1",
                name: "Famille Test",
                locale: "fr",
                timeZone: "Europe/Paris",
                soundsEnabled: true,
                morningStart: "06:00",
                morningEnd: "12:00",
                eveningStart: "18:00",
                eveningEnd: "21:00",
                subscription: nil,
                childProfiles: []
            ),
            completions: []
        )

        store.save(envelope)
        XCTAssertEqual(store.load()?.household.id, "household-1")
        XCTAssertEqual(store.load()?.dayKey, "2026-08-16")

        store.clear()
        XCTAssertNil(store.load())
    }
}
