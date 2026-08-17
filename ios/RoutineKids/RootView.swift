import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ZStack {
            CosmicBackground()

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
        .font(RoutineTypography.body())
    }
}

private struct CosmicBackground: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            RadialGradient(
                colors: [Color(red: 0.19, green: 0.13, blue: 0.37), Color(red: 0.055, green: 0.035, blue: 0.14)],
                center: .topLeading,
                startRadius: 20,
                endRadius: 900
            )

            GeometryReader { proxy in
                TimelineView(.animation(minimumInterval: reduceMotion ? 60 : 1.5)) { context in
                    let phase = reduceMotion ? 0 : context.date.timeIntervalSinceReferenceDate
                    ForEach(0..<64, id: \.self) { index in
                        let x = CGFloat((index * 47) % 101) / 100 * proxy.size.width
                        let baseY = CGFloat((index * 71) % 103) / 102 * proxy.size.height
                        let drift = CGFloat(sin(phase / 7 + Double(index))) * 3
                        Circle()
                            .fill(.white.opacity(index.isMultiple(of: 5) ? 0.42 : 0.18))
                            .frame(width: index.isMultiple(of: 7) ? 2.4 : 1.3)
                            .position(x: x, y: baseY + drift)
                    }
                }
            }
        }
        .ignoresSafeArea()
    }
}
