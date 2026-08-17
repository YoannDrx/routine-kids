import PhotosUI
import SwiftUI
import UIKit

struct NativeProfileEditorView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let profile: ChildProfile?

    @State private var name: String
    @State private var age: Int
    @State private var avatar: String
    @State private var headline: String
    @State private var photoItem: PhotosPickerItem?
    @State private var imageToCrop: UIImage?
    @State private var photoDataURL: String?
    @State private var removeExistingPhoto = false
    @State private var cropPresented = false
    @State private var deletePresented = false

    private let avatars = ["🧑‍🚀", "👩‍🚀", "🦊", "🐼", "🦁", "🐯", "🐰", "🐨"]

    init(profile: ChildProfile? = nil) {
        self.profile = profile
        _name = State(initialValue: profile?.name ?? "")
        _age = State(initialValue: profile?.age ?? 5)
        _avatar = State(initialValue: profile?.avatar ?? "🧑‍🚀")
        _headline = State(initialValue: profile?.headline ?? "")
    }

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
                            Text(
                                profile == nil
                                    ? String(localized: "profile.create.eyebrow")
                                    : String(localized: "profile.edit.eyebrow")
                            )
                                .font(.caption.weight(.bold))
                                .tracking(2)
                                .foregroundStyle(.cyan)
                            Text(
                                profile == nil
                                    ? String(localized: "profile.create.title")
                                    : String(localized: "profile.edit.title")
                            )
                                .font(RoutineTypography.display(size: 34, relativeTo: .largeTitle))
                            Text(
                                profile == nil
                                    ? String(localized: "profile.create.subtitle")
                                    : String(localized: "profile.edit.subtitle")
                            )
                                .foregroundStyle(.white.opacity(0.65))
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Text("profile.photo").font(.headline)
                            HStack(spacing: 16) {
                                photoPreview
                                    .frame(width: 92, height: 92)
                                    .background(.white.opacity(0.08), in: .circle)
                                    .overlay { Circle().stroke(.white.opacity(0.15)) }

                                VStack(alignment: .leading, spacing: 9) {
                                    PhotosPicker(selection: $photoItem, matching: .images) {
                                        Label("profile.photo.choose", systemImage: "photo.on.rectangle.angled")
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(.cyan)

                                    if photoDataURL != nil || (profile?.photoUrl != nil && !removeExistingPhoto) {
                                        Button("profile.photo.remove", role: .destructive) {
                                            photoDataURL = nil
                                            removeExistingPhoto = true
                                        }
                                    }
                                }
                            }
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
                            TextField("profile.name", text: $name)
                                .textContentType(.name)
                                .textInputAutocapitalization(.words)
                            Stepper(String(format: String(localized: "profile.age.format"), age), value: $age, in: 2...12)
                            TextField("profile.headline", text: $headline)
                        }
                        .textFieldStyle(.roundedBorder)

                        if let error = model.errorMessage {
                            Text(error)
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }

                        Button {
                            Task {
                                let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
                                let cleanHeadline = headline.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
                                let saved = if let profile {
                                    await model.updateProfile(
                                        id: profile.id,
                                        name: cleanName,
                                        age: age,
                                        avatar: avatar,
                                        headline: cleanHeadline,
                                        photoDataURL: photoDataURL,
                                        removePhoto: removeExistingPhoto
                                    )
                                } else {
                                    await model.createProfile(
                                        name: cleanName,
                                        age: age,
                                        avatar: avatar,
                                        headline: cleanHeadline,
                                        photoDataURL: photoDataURL
                                    )
                                }
                                if saved { dismiss() }
                            }
                        } label: {
                            Label(
                                profile == nil
                                    ? String(localized: "profile.create.action")
                                    : String(localized: "common.save"),
                                systemImage: "sparkles"
                            )
                                .font(.headline)
                                .frame(maxWidth: .infinity, minHeight: 52)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.pink)
                        .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || model.isWorking)

                        if profile != nil {
                            Button("profile.delete", role: .destructive) { deletePresented = true }
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(28)
                    .frame(maxWidth: 680)
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle(
                profile == nil
                    ? String(localized: "profile.create.navigation")
                    : String(localized: "profile.edit.navigation")
            )
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("common.cancel") { dismiss() }
                }
            }
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task {
                    guard
                        let data = try? await item.loadTransferable(type: Data.self),
                        let image = UIImage(data: data)
                    else { return }
                    imageToCrop = image
                    cropPresented = true
                }
            }
            .sheet(isPresented: $cropPresented) {
                if let imageToCrop {
                    NativePhotoCropperView(image: imageToCrop) { dataURL in
                        photoDataURL = dataURL
                        removeExistingPhoto = false
                    }
                }
            }
            .confirmationDialog(
                "profile.delete.confirm.title",
                isPresented: $deletePresented,
                titleVisibility: .visible
            ) {
                Button("profile.delete.confirm.action", role: .destructive) {
                    guard let profile else { return }
                    Task {
                        if await model.deleteProfile(id: profile.id) { dismiss() }
                    }
                }
                Button("common.cancel", role: .cancel) {}
            } message: {
                Text("profile.delete.confirm.message")
            }
        }
    }

    @ViewBuilder
    private var photoPreview: some View {
        if
            let photoDataURL,
            let comma = photoDataURL.firstIndex(of: ","),
            let data = Data(base64Encoded: String(photoDataURL[photoDataURL.index(after: comma)...])),
            let image = UIImage(data: data)
        {
            Image(uiImage: image).resizable().scaledToFill().clipShape(.circle)
        } else if let profile, !removeExistingPhoto {
            ProfilePortrait(profile: profile, fontSize: 42)
        } else {
            Text(avatar).font(.system(size: 42))
        }
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
