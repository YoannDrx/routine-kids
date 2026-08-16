import SwiftUI

struct NativeProfileEditorView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var age = 5
    @State private var avatar = "🧑‍🚀"
    @State private var headline = ""

    private let avatars = ["🧑‍🚀", "👩‍🚀", "🦊", "🐼", "🦁", "🐯", "🐰", "🐨"]

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.12, green: 0.05, blue: 0.29), Color(red: 0.03, green: 0.01, blue: 0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        VStack(alignment: .leading, spacing: 7) {
                            Text("NOUVEL ASTRONAUTE")
                                .font(.caption.weight(.bold))
                                .tracking(2)
                                .foregroundStyle(.cyan)
                            Text("Qui rejoint l’équipage ?")
                                .font(.system(size: 34, weight: .bold, design: .rounded))
                            Text("Deux routines prêtes à jouer seront créées automatiquement.")
                                .foregroundStyle(.white.opacity(0.65))
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Avatar").font(.headline)
                            LazyVGrid(columns: [GridItem(.adaptive(minimum: 58))], spacing: 12) {
                                ForEach(avatars, id: \.self) { candidate in
                                    Button {
                                        avatar = candidate
                                    } label: {
                                        Text(candidate)
                                            .font(.system(size: 32))
                                            .frame(width: 58, height: 58)
                                            .background(
                                                candidate == avatar ? Color.pink.opacity(0.45) : Color.white.opacity(0.08),
                                                in: .circle
                                            )
                                            .overlay {
                                                Circle().stroke(candidate == avatar ? .pink : .clear, lineWidth: 2)
                                            }
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityAddTraits(candidate == avatar ? .isSelected : [])
                                }
                            }
                        }

                        VStack(spacing: 16) {
                            TextField("Prénom", text: $name)
                                .textContentType(.name)
                                .textInputAutocapitalization(.words)
                            Stepper("Âge : \(age) ans", value: $age, in: 2...12)
                            TextField("Petite phrase (facultatif)", text: $headline)
                        }
                        .textFieldStyle(.roundedBorder)

                        if let error = model.errorMessage {
                            Text(error)
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }

                        Button {
                            Task {
                                let created = await model.createProfile(
                                    name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                                    age: age,
                                    avatar: avatar,
                                    headline: headline.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
                                )
                                if created { dismiss() }
                            }
                        } label: {
                            Label("Lancer les routines", systemImage: "sparkles")
                                .font(.headline)
                                .frame(maxWidth: .infinity, minHeight: 52)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.pink)
                        .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || model.isWorking)
                    }
                    .padding(28)
                    .frame(maxWidth: 680)
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("Créer un profil")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
            }
        }
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
