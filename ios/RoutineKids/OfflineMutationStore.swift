import Foundation

@MainActor
final class OfflineMutationStore {
    private let defaults: UserDefaults
    private let key = "routinekids.pending-completions.v1"
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func load() -> [CompletionMutation] {
        guard let data = defaults.data(forKey: key) else { return [] }
        return (try? decoder.decode([CompletionMutation].self, from: data)) ?? []
    }

    func save(_ mutations: [CompletionMutation]) {
        defaults.set(try? encoder.encode(mutations), forKey: key)
    }

    func clear() {
        defaults.removeObject(forKey: key)
    }
}
