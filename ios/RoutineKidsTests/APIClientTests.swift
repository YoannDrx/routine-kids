import Foundation
import Testing
@testable import RoutineKids

struct APIClientTests {
    @Test func originKeepsSchemeHostAndExplicitPort() throws {
        let url = try #require(URL(string: "http://127.0.0.1:3001/api"))

        #expect(APIClient.origin(for: url) == "http://127.0.0.1:3001")
    }

    @Test func originDropsPathQueryAndFragment() throws {
        let url = try #require(URL(string: "https://routine-kids.vercel.app/path?q=1#section"))

        #expect(APIClient.origin(for: url) == "https://routine-kids.vercel.app")
    }
}
