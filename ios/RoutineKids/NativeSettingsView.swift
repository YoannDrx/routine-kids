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
    @State private var profileEditorPresented = false
    @State private var missionManagerPresented = false

    var body: some View {
        ZStack {
            RadialGradient(
                colors: [Color(red: 0.18, green: 0.11, blue: 0.36), Color(red: 0.045, green: 0.025, blue: 0.12)],
                center: .topLeading,
                startRadius: 20,
                endRadius: 900
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                HStack(spacing: 14) {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.left")
                            .frame(width: 42, height: 42)
                            .background(.white.opacity(0.08), in: .circle)
                    }
                    .buttonStyle(.plain)
                    Text("Paramètres")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                    Spacer()
                    Text(model.envelope?.household.name ?? "RoutineKids")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.58))
                }
                .padding(.horizontal, 20)
                .frame(minHeight: 62)
                .background(Color(red: 0.055, green: 0.035, blue: 0.14).opacity(0.95))

                GeometryReader { proxy in
                    if proxy.size.width >= 760 {
                        HStack(alignment: .top, spacing: 14) {
                            managementColumn
                            billingColumn
                        }
                        .padding(16)
                    } else {
                        ScrollView {
                            VStack(spacing: 14) {
                                managementColumn
                                billingColumn
                            }
                            .padding(14)
                        }
                    }
                }
            }
        }
        .task { await store.load() }
        .sheet(isPresented: $profileEditorPresented) { NativeProfileEditorView() }
        .sheet(isPresented: $missionManagerPresented) { NativeMissionManagerView() }
        .sheet(isPresented: $accountDeletionPresented) {
            AccountDeletionView(householdName: model.envelope?.household.name ?? "") {
                accountDeletionPresented = false
                dismiss()
            }
        }
    }

    private var managementColumn: some View {
        VStack(spacing: 12) {
            settingsCard(title: "Mon équipage", icon: "person.3.fill", accent: .pink) {
                LabeledContent("Foyer", value: model.envelope?.household.name ?? "—")
                LabeledContent("Fuseau", value: model.envelope?.household.timeZone ?? "—")
                HStack {
                    Text("\(model.envelope?.household.childProfiles.count ?? 0) astronaute(s)")
                        .foregroundStyle(.white.opacity(0.66))
                    Spacer()
                    Button("Ajouter") { profileEditorPresented = true }
                        .buttonStyle(.borderedProminent)
                        .tint(.pink)
                }
            }

            settingsCard(title: "Application", icon: "sparkles", accent: .cyan) {
                Button {
                    missionManagerPresented = true
                } label: {
                    Label("Gérer les routines et missions", systemImage: "checklist")
                }
                .buttonStyle(.borderedProminent)
                .tint(.cyan)
                Toggle("Routines matin et soir", isOn: $notificationsEnabled)
                    .onChange(of: notificationsEnabled) { _, enabled in
                        updateNotifications(enabled: enabled)
                    }
                Link(destination: publicURL(path: "support")) {
                    Label("Centre de support", systemImage: "questionmark.circle")
                }
            }

            settingsCard(title: "Compte", icon: "lock.shield.fill", accent: .orange) {
                Button("Se déconnecter", role: .destructive) {
                    Task { await model.signOut(); dismiss() }
                }
                Button("Supprimer mon compte et mes données", role: .destructive) {
                    accountDeletionPresented = true
                }
                .font(.footnote.weight(.semibold))
                Text("La suppression est définitive. Un abonnement Apple doit être résilié séparément.")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .frame(maxWidth: .infinity, alignment: .top)
    }

    private var billingColumn: some View {
        settingsCard(title: "Family Plus", icon: "crown.fill", accent: .yellow) {
            if model.envelope?.household.subscription?.isPremium == true {
                Label("Abonnement actif", systemImage: "checkmark.seal.fill")
                    .font(.headline)
                    .foregroundStyle(.green)
                if model.envelope?.household.subscription?.provider == "APPLE" {
#if os(iOS)
                    Button("Gérer l’abonnement") {
                        Task {
                            guard let scene = currentWindowScene else { return }
                            try? await AppStore.showManageSubscriptions(in: scene)
                        }
                    }
                    .buttonStyle(.borderedProminent)
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
                            VStack(alignment: .leading, spacing: 3) {
                                Text(product.displayName).fontWeight(.bold)
                                Text(product.description).font(.caption).foregroundStyle(.white.opacity(0.55))
                            }
                            Spacer()
                            Text("\(product.displayPrice) / \(billingPeriod(for: product))")
                                .font(.subheadline.weight(.bold))
                        }
                        .padding(12)
                        .background(.yellow.opacity(0.1), in: .rect(cornerRadius: 14))
                    }
                    .buttonStyle(.plain)
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
            Text("Paiement via votre identifiant Apple. Renouvellement automatique sauf résiliation au moins 24 h avant l’échéance.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
            HStack {
                Link("Confidentialité", destination: publicURL(path: "privacy"))
                Spacer()
                Link("Conditions", destination: publicURL(path: "terms"))
            }
            .font(.footnote)
        }
        .frame(maxWidth: .infinity, alignment: .top)
    }

    private func settingsCard<Content: View>(
        title: String,
        icon: String,
        accent: Color,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 13) {
            Label(title, systemImage: icon)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(accent)
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white.opacity(0.065), in: .rect(cornerRadius: 20))
        .overlay { RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.1)) }
    }

    private func updateNotifications(enabled: Bool) {
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
