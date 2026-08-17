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

    func createProfile(
        name: String,
        age: Int,
        avatar: String,
        headline: String?,
        photoDataURL: String?
    ) async throws {
        struct Body: Encodable {
            let name: String
            let age: Int
            let avatar: String
            let headline: String?
            let photoDataUrl: String?
        }
        _ = try await send(
            path: "/api/v1/profiles",
            method: "POST",
            body: Body(
                name: name,
                age: age,
                avatar: avatar,
                headline: headline,
                photoDataUrl: photoDataURL
            )
        ) as EmptyResponse
    }

    func updateProfile(id: String, name: String, age: Int, avatar: String, headline: String?) async throws {
        struct Body: Encodable {
            let name: String
            let age: Int
            let avatar: String
            let headline: String?
        }
        _ = try await send(
            path: "/api/v1/profiles/\(id)",
            method: "PATCH",
            body: Body(name: name, age: age, avatar: avatar, headline: headline)
        ) as EmptyResponse
    }

    func deleteProfile(id: String) async throws {
        _ = try await send(
            path: "/api/v1/profiles/\(id)",
            method: "DELETE",
            body: EmptyRequest()
        ) as EmptyResponse
    }

    func updateProfilePhoto(id: String, dataURL: String) async throws {
        struct Body: Encodable { let dataUrl: String }
        _ = try await send(
            path: "/api/v1/profiles/\(id)/photo",
            method: "PUT",
            body: Body(dataUrl: dataURL)
        ) as EmptyResponse
    }

    func removeProfilePhoto(id: String) async throws {
        _ = try await send(
            path: "/api/v1/profiles/\(id)/photo",
            method: "DELETE",
            body: EmptyRequest()
        ) as EmptyResponse
    }

    func updateHousehold(
        name: String,
        locale: String,
        timeZone: String,
        soundsEnabled: Bool,
        morningStart: String,
        morningEnd: String,
        eveningStart: String,
        eveningEnd: String
    ) async throws {
        struct Body: Encodable {
            let name: String
            let locale: String
            let timeZone: String
            let soundsEnabled: Bool
            let morningStart: String
            let morningEnd: String
            let eveningStart: String
            let eveningEnd: String
        }
        _ = try await send(
            path: "/api/v1/household",
            method: "PATCH",
            body: Body(
                name: name,
                locale: locale,
                timeZone: timeZone,
                soundsEnabled: soundsEnabled,
                morningStart: morningStart,
                morningEnd: morningEnd,
                eveningStart: eveningStart,
                eveningEnd: eveningEnd
            )
        ) as EmptyResponse
    }

    func loadTemplates() async throws -> TemplateEnvelope {
        try await send(path: "/api/v1/templates", method: "GET", body: Optional<EmptyRequest>.none)
    }

    func saveTemplate(
        id: String?,
        title: String,
        shortLabel: String,
        icon: String,
        durationMinutes: Int,
        imageDataURL: String?,
        removeImage: Bool
    ) async throws {
        struct Body: Encodable {
            let templateId: String?
            let title: String
            let shortLabel: String
            let icon: String
            let durationMinutes: Int
            let imageDataUrl: String?
            let removeImage: Bool
        }
        _ = try await send(
            path: "/api/v1/templates",
            method: "POST",
            body: Body(
                templateId: id,
                title: title,
                shortLabel: shortLabel,
                icon: icon,
                durationMinutes: durationMinutes,
                imageDataUrl: imageDataURL,
                removeImage: removeImage
            )
        ) as EmptyResponse
    }

    func deleteTemplate(id: String) async throws {
        _ = try await send(
            path: "/api/v1/templates/\(id)",
            method: "DELETE",
            body: EmptyRequest()
        ) as EmptyResponse
    }

    func assignTemplate(
        templateId: String,
        childProfileId: String,
        period: String,
        scheduleDays: [Int] = Array(0...6)
    ) async throws {
        struct Body: Encodable {
            let templateId: String
            let childProfileId: String
            let period: String
            let scheduleDays: [Int]
        }
        _ = try await send(
            path: "/api/v1/routine-tasks",
            method: "POST",
            body: Body(
                templateId: templateId,
                childProfileId: childProfileId,
                period: period,
                scheduleDays: scheduleDays
            )
        ) as EmptyResponse
    }

    func updateRoutineTaskSchedule(taskId: String, childProfileId: String, scheduleDays: [Int]) async throws {
        struct Body: Encodable {
            let childProfileId: String
            let scheduleDays: [Int]
        }
        _ = try await send(
            path: "/api/v1/routine-tasks/\(taskId)",
            method: "PATCH",
            body: Body(childProfileId: childProfileId, scheduleDays: scheduleDays)
        ) as EmptyResponse
    }

    func deleteRoutineTask(taskId: String, childProfileId: String) async throws {
        struct Body: Encodable { let childProfileId: String }
        _ = try await send(
            path: "/api/v1/routine-tasks/\(taskId)",
            method: "DELETE",
            body: Body(childProfileId: childProfileId)
        ) as EmptyResponse
    }

    func renameRoutine(childProfileId: String, period: String, title: String) async throws {
        struct Body: Encodable {
            let childProfileId: String
            let period: String
            let title: String
        }
        _ = try await send(
            path: "/api/v1/routines",
            method: "POST",
            body: Body(childProfileId: childProfileId, period: period, title: title)
        ) as EmptyResponse
    }

    func reorderRoutineTasks(childProfileId: String, period: String, orderedTaskIds: [String]) async throws {
        struct Body: Encodable {
            let childProfileId: String
            let period: String
            let orderedTaskIds: [String]
        }
        _ = try await send(
            path: "/api/v1/routines",
            method: "PATCH",
            body: Body(
                childProfileId: childProfileId,
                period: period,
                orderedTaskIds: orderedTaskIds
            )
        ) as EmptyResponse
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
