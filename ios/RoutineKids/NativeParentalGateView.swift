import SwiftUI

struct NativeParentalGateView: View {
    let pinConfigured: Bool
    let onUnlocked: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var credential = ""
    @State private var isWorking = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 52))
                    .foregroundStyle(.pink)

                Text("Espace parents")
                    .font(.system(size: 30, weight: .bold, design: .rounded))

                Text(
                    pinConfigured
                        ? "Saisissez le code parent à 4 chiffres."
                        : "Confirmez le mot de passe du compte parent."
                )
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

                SecureField(pinConfigured ? "Code parent" : "Mot de passe", text: $credential)
                    .textContentType(pinConfigured ? .oneTimeCode : .password)
                    .nativeParentCredentialTraits(pinConfigured: pinConfigured)
                    .padding()
                    .background(.secondary.opacity(0.12), in: .rect(cornerRadius: 16))
                    .onChange(of: credential) { _, value in
                        if pinConfigured {
                            credential = String(value.filter(\.isNumber).prefix(4))
                        }
                    }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .accessibilityLabel("Erreur : \(errorMessage)")
                }

                Button {
                    Task { await verify() }
                } label: {
                    Group {
                        if isWorking { ProgressView() } else { Text("Ouvrir les réglages") }
                    }
                    .frame(maxWidth: .infinity, minHeight: 52)
                }
                .buttonStyle(.borderedProminent)
                .tint(.pink)
                .disabled(
                    isWorking ||
                        (pinConfigured ? credential.count != 4 : credential.isEmpty)
                )
            }
            .padding(28)
            .frame(maxWidth: 460)
            .navigationTitle("Vérification parentale")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
            }
        }
    }

    private func verify() async {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            try await APIClient.shared.verifyParent(credential: credential)
            onUnlocked()
        } catch let error as APIError where error.error == "too_many_attempts" {
            errorMessage = "Trop de tentatives. Réessayez dans dix minutes."
        } catch {
            errorMessage = pinConfigured
                ? "Code parent incorrect."
                : "Mot de passe incorrect."
        }
    }
}

private extension View {
    @ViewBuilder
    func nativeParentCredentialTraits(pinConfigured: Bool) -> some View {
#if os(iOS)
        if pinConfigured {
            self.keyboardType(.numberPad)
        } else {
            self
        }
#else
        self
#endif
    }
}
