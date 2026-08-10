import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.16, green: 0.1, blue: 0.32), Color(red: 0.04, green: 0.02, blue: 0.1)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            switch model.phase {
            case .loading:
                ProgressView("Synchronisation…")
                    .tint(.white)
                    .foregroundStyle(.white)
            case .signedOut:
                SignInView()
            case .ready:
                BoardView()
            }
        }
    }
}
