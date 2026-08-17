import Foundation
import Observation
import StoreKit

@MainActor
@Observable
final class StoreManager {
    var products: [Product] = []
    var isWorking = false
    var errorMessage: String?

    private let productIds: [String]

    init(bundle: Bundle = .main) {
        productIds = ["APPLE_MONTHLY_PRODUCT_ID", "APPLE_YEARLY_PRODUCT_ID"]
            .compactMap { bundle.object(forInfoDictionaryKey: $0) as? String }
            .filter { !$0.isEmpty }
    }

    func load() async {
        do {
            products = try await Product.products(for: productIds).sorted { $0.price < $1.price }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func purchase(_ product: Product, appAccountToken: UUID) async -> Bool {
        isWorking = true
        defer { isWorking = false }
        do {
            let result = try await product.purchase(options: [.appAccountToken(appAccountToken)])
            guard case let .success(verification) = result else { return false }
            let transaction = try verified(verification)
            try await APIClient.shared.syncAppleTransaction(verification.jwsRepresentation)
            await transaction.finish()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func restore(appAccountToken: UUID) async -> Bool {
        isWorking = true
        defer { isWorking = false }
        do {
            try await AppStore.sync()
            for await result in Transaction.currentEntitlements {
                let transaction = try verified(result)
                guard productIds.contains(transaction.productID) else { continue }
                guard transaction.appAccountToken == appAccountToken else { continue }
                try await APIClient.shared.syncAppleTransaction(result.jwsRepresentation)
                await transaction.finish()
                return true
            }
            return false
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func verified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case let .verified(value): value
        case let .unverified(_, error): throw error
        }
    }
}
