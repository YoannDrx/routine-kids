import StoreKit
import SwiftUI
#if os(iOS)
import UIKit
#endif

struct NativeSettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var store = StoreManager()
    @State private var notificationsEnabled = false
    @State private var accountDeletionPresented = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Famille") {
                    LabeledContent("Foyer", value: model.envelope?.household.name ?? "—")
                    LabeledContent("Fuseau", value: model.envelope?.household.timeZone ?? "—")
                }

                Section("Rappels") {
                    Toggle("Routines matin et soir", isOn: $notificationsEnabled)
                        .onChange(of: notificationsEnabled) { _, enabled in
                            guard enabled, let household = model.envelope?.household else { return }
                            Task {
                                let granted = (try? await NotificationScheduler.requestAndSchedule(
                                    morning: household.morningStart,
                                    evening: household.eveningStart
                                )) ?? false
                                notificationsEnabled = granted
                                try? await APIClient.shared.registerDevice(
                                    deviceId: model.deviceId,
                                    notificationsEnabled: granted,
                                    locale: household.locale
                                )
                            }
                        }
                }

                Section("Family Plus") {
                    if model.envelope?.household.subscription?.isPremium == true {
                        Label("Abonnement actif", systemImage: "checkmark.seal.fill")
                            .foregroundStyle(.green)
                        if model.envelope?.household.subscription?.provider == "APPLE" {
#if os(iOS)
                            Button("Gérer l’abonnement") {
                                Task {
                                    guard let scene = currentWindowScene else { return }
                                    try? await AppStore.showManageSubscriptions(in: scene)
                                }
                            }
#endif
                        }
                    } else if let token = UUID(uuidString: model.envelope?.appAccountToken ?? "") {
                        ForEach(store.products, id: \.id) { product in
                            Button {
                                Task {
                                    if await store.purchase(product, appAccountToken: token) {
                                        try? await model.refresh()
                                    }
                                }
                            } label: {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(product.displayName).fontWeight(.semibold)
                                        Text(product.description).font(.caption).foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Text("\(product.displayPrice) / \(billingPeriod(for: product))")
                                        .fontWeight(.bold)
                                }
                            }
                            .disabled(store.isWorking)
                        }
                        Button("Restaurer les achats") {
                            Task {
                                if await store.restore(appAccountToken: token) {
                                    try? await model.refresh()
                                }
                            }
                        }
                    }

                    if let error = store.errorMessage {
                        Text(error).font(.footnote).foregroundStyle(.red)
                    }

                    Text("Le paiement est débité sur votre identifiant Apple. L’abonnement se renouvelle automatiquement sauf résiliation au moins 24 heures avant la fin de la période en cours.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    HStack {
                        Link("Confidentialité", destination: publicURL(path: "privacy"))
                        Spacer()
                        Link("Conditions", destination: publicURL(path: "terms"))
                    }
                    .font(.footnote)
                }

                Section("Aide") {
                    Link("Centre de support", destination: publicURL(path: "support"))
                }

                Section {
                    Button("Supprimer mon compte et mes données", role: .destructive) {
                        accountDeletionPresented = true
                    }
                } header: {
                    Text("Compte")
                } footer: {
                    Text("La suppression est définitive. Un abonnement Apple doit être résilié séparément dans l’App Store.")
                }

                Section {
                    Button("Se déconnecter", role: .destructive) {
                        Task { await model.signOut(); dismiss() }
                    }
                }
            }
            .navigationTitle("Réglages parents")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
            .task { await store.load() }
            .sheet(isPresented: $accountDeletionPresented) {
                AccountDeletionView(
                    householdName: model.envelope?.household.name ?? ""
                ) {
                    accountDeletionPresented = false
                    dismiss()
                }
            }
        }
    }

    private func billingPeriod(for product: Product) -> String {
        guard let period = product.subscription?.subscriptionPeriod else {
            return "période"
        }

        let unit = switch period.unit {
        case .day: "jour"
        case .week: "semaine"
        case .month: "mois"
        case .year: "an"
        @unknown default: "période"
        }

        return period.value == 1 ? unit : "\(period.value) \(unit)s"
    }

    private func publicURL(path: String) -> URL {
        guard
            let configured = Bundle.main.object(forInfoDictionaryKey: "ROUTINEKIDS_API_BASE_URL") as? String,
            let baseURL = URL(string: configured),
            let url = URL(string: path, relativeTo: baseURL)
        else {
            preconditionFailure("ROUTINEKIDS_API_BASE_URL must be configured")
        }

        return url
    }

#if os(iOS)
    private var currentWindowScene: UIWindowScene? {
        UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
    }
#endif
}

private struct AccountDeletionView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let householdName: String
    let onDeleted: () -> Void

    @State private var confirmation = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Suppression définitive") {
                    Text("Toutes les routines, profils, images et données du foyer « \(householdName) » seront supprimés.")
                    Text("Si vous payez via Apple, gérez d’abord l’abonnement dans l’App Store pour éviter son renouvellement.")
                        .foregroundStyle(.secondary)
                    Link(
                        "Gérer mon abonnement Apple",
                        destination: URL(string: "https://apps.apple.com/account/subscriptions")!
                    )
                }

                Section {
                    TextField("Tapez SUPPRIMER", text: $confirmation)

                    if let errorMessage = model.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    Button("Supprimer définitivement", role: .destructive) {
                        Task {
                            if await model.deleteAccount(householdName: householdName) {
                                onDeleted()
                            }
                        }
                    }
                    .disabled(
                        confirmation.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() != "SUPPRIMER"
                            || householdName.isEmpty
                            || model.isWorking
                    )
                }
            }
            .navigationTitle("Supprimer le compte")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
            }
        }
    }
}
