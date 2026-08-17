import SwiftUI

struct ProfilePortrait: View {
    let profile: ChildProfile
    var fontSize: CGFloat = 34

    var body: some View {
        Group {
            if let url = RoutineKidsMediaURL.resolve(profile.photoUrl) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        fallback
                    }
                }
            } else {
                fallback
            }
        }
        .clipShape(.circle)
        .accessibilityLabel(profile.name)
    }

    private var fallback: some View {
        Text(profile.avatar ?? "🧑‍🚀")
            .font(.system(size: fontSize))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

enum RoutineKidsMediaURL {
    static func resolve(_ reference: String?) -> URL? {
        guard
            let reference,
            reference.hasPrefix("rk-media:"),
            let configured = Bundle.main.object(forInfoDictionaryKey: "ROUTINEKIDS_API_BASE_URL") as? String,
            let baseURL = URL(string: configured)
        else { return nil }

        let pathname = String(reference.dropFirst("rk-media:".count))
        let encoded = pathname
            .split(separator: "/")
            .map { String($0).addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? String($0) }
            .joined(separator: "/")
        return URL(string: "/api/media/\(encoded)", relativeTo: baseURL)
    }
}
