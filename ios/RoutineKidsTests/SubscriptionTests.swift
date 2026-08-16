import XCTest
@testable import RoutineKids

final class SubscriptionTests: XCTestCase {
    func testPremiumEntitlementMatchesServerPolicy() {
        XCTAssertTrue(
            Subscription(
                plan: "FAMILY_PLUS",
                status: "ACTIVE",
                provider: "APPLE",
                environment: "TEST",
                periodEnd: nil,
                revokedAt: nil
            ).isPremium
        )
        XCTAssertTrue(
            Subscription(
                plan: "FAMILY_PLUS",
                status: "TRIALING",
                provider: "STRIPE",
                environment: "PRODUCTION",
                periodEnd: nil,
                revokedAt: nil
            ).isPremium
        )
        XCTAssertFalse(
            Subscription(
                plan: "FAMILY_PLUS",
                status: "PAST_DUE",
                provider: "APPLE",
                environment: "TEST",
                periodEnd: nil,
                revokedAt: nil
            ).isPremium
        )
        XCTAssertFalse(
            Subscription(
                plan: "FREE",
                status: "ACTIVE",
                provider: "NONE",
                environment: "TEST",
                periodEnd: nil,
                revokedAt: nil
            ).isPremium
        )
        XCTAssertFalse(
            Subscription(
                plan: "FAMILY_PLUS",
                status: "ACTIVE",
                provider: "STRIPE",
                environment: "TEST",
                periodEnd: nil,
                revokedAt: nil
            ).isPremium
        )
    }
}
