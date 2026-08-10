import Foundation

actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let baseURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(bundle: Bundle = .main) {
        guard
            let configured = bundle.object(forInfoDictionaryKey: "ROUTINEKIDS_API_BASE_URL") as? String,
            let url = URL(string: configured),
            ["https", "http"].contains(url.scheme?.lowercased())
        else {
            preconditionFailure("ROUTINEKIDS_API_BASE_URL must be configured")
        }

        baseURL = url
        let configuration = URLSessionConfiguration.default
        configuration.httpCookieStorage = .shared
        configuration.httpShouldSetCookies = true
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.urlCache = nil
        session = URLSession(configuration: configuration)
    }

    func signIn(email: String, password: String) async throws {
        struct Body: Encodable { let email: String; let password: String; let rememberMe = true }
        _ = try await send(path: "/api/auth/sign-in/email", method: "POST", body: Body(email: email, password: password)) as EmptyResponse
    }

    func signUp(name: String, email: String, password: String) async throws {
        struct Body: Encodable {
            let name: String
            let email: String
            let password: String
            let callbackURL = "/"
        }
        _ = try await send(
            path: "/api/auth/sign-up/email",
            method: "POST",
            body: Body(name: name, email: email, password: password)
        ) as EmptyResponse
    }

    func requestPasswordReset(email: String) async throws {
        struct Body: Encodable {
            let email: String
            let redirectTo = "/reset-password"
        }
        _ = try await send(
            path: "/api/auth/request-password-reset",
            method: "POST",
            body: Body(email: email)
        ) as EmptyResponse
    }

    func signOut() async throws {
        defer {
            HTTPCookieStorage.shared.cookies(for: baseURL)?.forEach(
                HTTPCookieStorage.shared.deleteCookie
            )
        }
        _ = try await send(path: "/api/auth/sign-out", method: "POST", body: EmptyRequest()) as EmptyResponse
    }

    func loadHousehold() async throws -> HouseholdEnvelope {
        try await send(path: "/api/v1/household", method: "GET", body: Optional<EmptyRequest>.none)
    }

    func apply(_ mutation: CompletionMutation) async throws {
        _ = try await send(path: "/api/v1/completions", method: "POST", body: mutation) as EmptyResponse
    }

    func registerDevice(deviceId: String, notificationsEnabled: Bool, locale: String) async throws {
        struct Body: Encodable {
            let deviceId: String
            let platform = "IOS"
            let locale: String
            let notificationsEnabled: Bool
        }
        _ = try await send(
            path: "/api/v1/devices",
            method: "POST",
            body: Body(deviceId: deviceId, locale: locale, notificationsEnabled: notificationsEnabled)
        ) as EmptyResponse
    }

    func verifyParent(credential: String) async throws {
        struct Body: Encodable { let credential: String }
        _ = try await send(
            path: "/api/v1/parent/step-up",
            method: "POST",
            body: Body(credential: credential)
        ) as EmptyResponse
    }

    func syncAppleTransaction(_ signedTransaction: String) async throws {
        struct Body: Encodable { let signedTransaction: String }
        _ = try await send(
            path: "/api/v1/billing/apple/transaction",
            method: "POST",
            body: Body(signedTransaction: signedTransaction)
        ) as EmptyResponse
    }

    func deleteAccount(householdName: String) async throws {
        struct Body: Encodable {
            let householdName: String
            let confirmation = "DELETE"
        }
        _ = try await send(
            path: "/api/v1/account",
            method: "DELETE",
            body: Body(householdName: householdName)
        ) as EmptyResponse
    }

    private func send<Response: Decodable, Body: Encodable>(
        path: String,
        method: String,
        body: Body?
    ) async throws -> Response {
        guard let url = URL(string: path, relativeTo: baseURL) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if !["GET", "HEAD", "OPTIONS"].contains(method.uppercased()),
           let origin = Self.origin(for: baseURL) {
            request.setValue(origin, forHTTPHeaderField: "Origin")
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        guard (200..<300).contains(http.statusCode) else {
            if let apiError = try? decoder.decode(APIError.self, from: data) { throw apiError }
            throw URLError(.badServerResponse)
        }
        if data.isEmpty || Response.self == EmptyResponse.self {
            return EmptyResponse() as! Response
        }
        return try decoder.decode(Response.self, from: data)
    }

    static func origin(for url: URL) -> String? {
        guard let scheme = url.scheme, let host = url.host else { return nil }
        var components = URLComponents()
        components.scheme = scheme
        components.host = host
        components.port = url.port
        return components.url?.absoluteString
    }
}

private struct EmptyRequest: Codable, Sendable {}
private struct EmptyResponse: Codable, Sendable {}
