import SwiftUI

struct SignInView: View {
    @Environment(AppModel.self) private var model
    @State private var isSignUp = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var forgotPasswordPresented = false

    var body: some View {
        @Bindable var model = model

        VStack(spacing: 20) {
            Text("RoutineKids")
                .font(.system(size: 42, weight: .bold, design: .rounded))
            Text(isSignUp ? String(localized: "auth.signup.title") : String(localized: "auth.signin.title"))
                .foregroundStyle(.secondary)

            if isSignUp {
                TextField("Prénom du parent", text: $name)
                    .textContentType(.name)
                    .padding()
                    .background(.white.opacity(0.08), in: .rect(cornerRadius: 16))
            }

            TextField("Email", text: $email)
                .textContentType(.emailAddress)
                .routineEmailInputTraits()
                .padding()
                .background(.white.opacity(0.08), in: .rect(cornerRadius: 16))

            SecureField("Mot de passe", text: $password)
                .textContentType(.password)
                .padding()
                .background(.white.opacity(0.08), in: .rect(cornerRadius: 16))

            if let error = model.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .accessibilityLabel("Erreur : \(error)")
            }

            if let notice = model.authNotice {
                Text(notice)
                    .font(.footnote)
                    .foregroundStyle(.green)
                    .multilineTextAlignment(.center)
            }

            Button {
                Task {
                    if isSignUp {
                        await model.signUp(name: name, email: email, password: password)
                    } else {
                        await model.signIn(email: email, password: password)
                    }
                }
            } label: {
                Group {
                    if model.isWorking {
                        ProgressView()
                    } else {
                        Text(isSignUp ? String(localized: "auth.signup.action") : String(localized: "auth.signin.action"))
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 52)
            }
            .buttonStyle(.borderedProminent)
            .tint(.pink)
            .disabled(
                email.isEmpty
                    || password.count < 8
                    || (isSignUp && name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    || model.isWorking
            )

            HStack(spacing: 18) {
                Button(isSignUp ? String(localized: "auth.signin.switch") : String(localized: "auth.signup.switch")) {
                    model.errorMessage = nil
                    model.authNotice = nil
                    isSignUp.toggle()
                }
                Button("Mot de passe oublié") {
                    forgotPasswordPresented = true
                }
            }
            .font(.footnote.weight(.semibold))

            HStack(spacing: 18) {
                Link("Confidentialité", destination: publicURL(path: "privacy"))
                Link("Conditions", destination: publicURL(path: "terms"))
                Link("Support", destination: publicURL(path: "support"))
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding(28)
        .frame(maxWidth: 460)
        .background(.ultraThinMaterial, in: .rect(cornerRadius: 32))
        .padding()
        .sheet(isPresented: $forgotPasswordPresented) {
            ForgotPasswordView(initialEmail: email)
        }
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
}

private struct ForgotPasswordView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var email: String
    @State private var sent = false

    init(initialEmail: String) {
        _email = State(initialValue: initialEmail)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .routineEmailInputTraits()
                } footer: {
                    Text("La même confirmation est affichée pour toutes les adresses afin de protéger les comptes.")
                }

                if sent {
                    Section {
                        Text("Si cette adresse existe, un lien de réinitialisation vient d’être envoyé.")
                            .foregroundStyle(.green)
                    }
                } else {
                    Section {
                        Button("Envoyer le lien") {
                            sent = true
                            Task { await model.requestPasswordReset(email: email) }
                        }
                        .disabled(email.isEmpty)
                    }
                }
            }
            .navigationTitle("Mot de passe oublié")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }
}

private extension View {
    @ViewBuilder
    func routineEmailInputTraits() -> some View {
#if os(iOS)
        self
            .textInputAutocapitalization(.never)
            .keyboardType(.emailAddress)
#else
        self
#endif
    }
}
