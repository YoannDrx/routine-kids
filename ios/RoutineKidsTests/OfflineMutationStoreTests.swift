import XCTest
@testable import RoutineKids

@MainActor
final class OfflineMutationStoreTests: XCTestCase {
    func testPersistsAndClearsPendingMutations() throws {
        let suite = "RoutineKidsTests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = OfflineMutationStore(defaults: defaults)
        let mutation = CompletionMutation(
            mutationId: "mutation-123",
            deviceId: "device-123",
            childProfileId: "child-123",
            taskId: "task-123",
            dayKey: "2026-08-10",
            completed: true
        )

        store.save([mutation])
        XCTAssertEqual(store.load().map(\.mutationId), ["mutation-123"])
        store.clear()
        XCTAssertTrue(store.load().isEmpty)
    }
}
