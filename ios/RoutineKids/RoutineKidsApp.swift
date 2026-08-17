import SwiftUI

@main
struct RoutineKidsApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .preferredColorScheme(.dark)
                .task {
                    guard !AppModel.isRunningUITests else { return }
                    await model.restoreSession()
                }
        }
    }
}
