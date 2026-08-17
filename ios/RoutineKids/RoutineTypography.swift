import SwiftUI

enum RoutineTypography {
    enum Weight {
        case regular
        case medium
        case semibold
        case bold
        case black
    }

    static func display(
        size: CGFloat,
        relativeTo style: Font.TextStyle,
        weight: Weight = .bold
    ) -> Font {
        .custom(fredokaName(for: weight), size: size, relativeTo: style)
    }

    static func body(
        size: CGFloat = 17,
        relativeTo style: Font.TextStyle = .body,
        weight: Weight = .regular
    ) -> Font {
        .custom(nunitoName(for: weight), size: size, relativeTo: style)
    }

    private static func fredokaName(for weight: Weight) -> String {
        switch weight {
        case .regular: "Fredoka-Regular"
        case .medium: "Fredoka-Medium"
        case .semibold: "Fredoka-SemiBold"
        case .bold, .black: "Fredoka-Bold"
        }
    }

    private static func nunitoName(for weight: Weight) -> String {
        switch weight {
        case .regular: "Nunito-Regular"
        case .medium: "Nunito-Medium"
        case .semibold: "Nunito-SemiBold"
        case .bold: "Nunito-Bold"
        case .black: "Nunito-Black"
        }
    }
}
