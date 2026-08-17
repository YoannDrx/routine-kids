import Foundation
import UserNotifications

enum NotificationScheduler {
    static func requestAndSchedule(morning: String, evening: String) async throws -> Bool {
        let center = UNUserNotificationCenter.current()
        let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
        guard granted else { return false }

        center.removePendingNotificationRequests(withIdentifiers: ["morning", "evening"])
        try await schedule(identifier: "morning", time: morning, title: "Routine du matin", body: "La mission peut commencer 🚀")
        try await schedule(identifier: "evening", time: evening, title: "Routine du soir", body: "C’est le moment de préparer une douce soirée 🌙")
        return true
    }

    private static func schedule(identifier: String, time: String, title: String, body: String) async throws {
        let parts = time.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: DateComponents(hour: parts[0], minute: parts[1]),
            repeats: true
        )
        try await UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        )
    }
}
