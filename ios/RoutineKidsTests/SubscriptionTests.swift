import XCTest
@testable import RoutineKids

final class SubscriptionTests: XCTestCase {
    func testPremiumEntitlementMatchesServerPolicy() {
        XCTAssertTrue(
            Subscription(
                plan: "FAMILY_PLUS",
                status: "ACTIVE",
                provider: "APPLE",
                periodEnd: nil
            ).isPremium
        )
        XCTAssertTrue(
            Subscription(
                plan: "FAMILY_PLUS",
                status: "TRIALING",
                provider: "STRIPE",
                periodEnd: nil
            ).isPremium
        )
        XCTAssertFalse(
            Subscription(
                plan: "FAMILY_PLUS",
                status: "PAST_DUE",
                provider: "APPLE",
                periodEnd: nil
            ).isPremium
        )
        XCTAssertFalse(
            Subscription(
                plan: "FREE",
                status: "ACTIVE",
                provider: "NONE",
                periodEnd: nil
            ).isPremium
        )
    }
}
