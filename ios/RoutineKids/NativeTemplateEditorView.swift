import PhotosUI
import SwiftUI
import UIKit

struct NativeTemplateEditorView: View {
    @Environment(\.dismiss) private var dismiss
    let template: TaskTemplateSummary?
    let onSaved: () async -> Void

    @State private var title: String
    @State private var shortLabel: String
    @State private var icon: String
    @State private var durationMinutes: Int
    @State private var photoItem: PhotosPickerItem?
    @State private var imageToCrop: UIImage?
    @State private var imageDataURL: String?
    @State private var removeExistingImage = false
    @State private var cropPresented = false
    @State private var deletePresented = false
    @State private var isWorking = false
    @State private var errorMessage: String?

    private let icons = ["sparkles", "sun", "droplets", "book-open", "school", "heart", "bed", "moon"]

    init(template: TaskTemplateSummary?, onSaved: @escaping () async -> Void) {
        self.template = template
        self.onSaved = onSaved
        _title = State(initialValue: template?.title ?? "")
        _shortLabel = State(initialValue: template?.shortLabel ?? "")
        _icon = State(initialValue: template?.icon ?? "sparkles")
        _durationMinutes = State(initialValue: template?.durationMinutes ?? 5)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("template.section.details") {
                    TextField("template.title", text: $title)
                    TextField("template.short", text: $shortLabel)
                    Stepper(
                        String(format: String(localized: "template.duration"), durationMinutes),
                        value: $durationMinutes,
                        in: 1...120
                    )
                }

                Section("template.section.icon") {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 48))], spacing: 10) {
                        ForEach(icons, id: \.self) { candidate in
                            Button {
                                icon = candidate
                            } label: {
                                Image(systemName: symbol(for: candidate))
                                    .font(.title3)
                                    .frame(width: 48, height: 48)
                                    .background(icon == candidate ? Color.pink : Color.secondary.opacity(0.12), in: .circle)
                            }
                            .buttonStyle(.plain)
                            .accessibilityAddTraits(icon == candidate ? .isSelected : [])
                        }
                    }
                }

                Section("template.section.photo") {
                    HStack(spacing: 14) {
                        imagePreview
                            .frame(width: 76, height: 76)
                            .background(Color.secondary.opacity(0.1), in: .rect(cornerRadius: 18))
                            .clipShape(.rect(cornerRadius: 18))
                        VStack(alignment: .leading, spacing: 8) {
                            PhotosPicker(selection: $photoItem, matching: .images) {
                                Label("template.photo.choose", systemImage: "photo.on.rectangle.angled")
                            }
                            if imageDataURL != nil || (template?.imageUrl != nil && !removeExistingImage) {
                                Button("template.photo.remove", role: .destructive) {
                                    imageDataURL = nil
                                    removeExistingImage = true
                                }
                            }
                        }
                    }
                }

                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(.red) }
                }

                if let template, !template.isBuiltIn {
                    Section {
                        Button("template.delete", role: .destructive) { deletePresented = true }
                    }
                }
            }
            .navigationTitle(template == nil ? String(localized: "template.create") : String(localized: "template.edit"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("common.cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("common.save") { Task { await save() } }
                        .disabled(
                            title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                || shortLabel.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                || isWorking
                        )
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
                        imageDataURL = dataURL
                        removeExistingImage = false
                    }
                }
            }
            .confirmationDialog("template.delete.confirm", isPresented: $deletePresented) {
                Button("template.delete", role: .destructive) { Task { await delete() } }
                Button("common.cancel", role: .cancel) {}
            }
        }
    }

    @ViewBuilder
    private var imagePreview: some View {
        if
            let imageDataURL,
            let comma = imageDataURL.firstIndex(of: ","),
            let data = Data(base64Encoded: String(imageDataURL[imageDataURL.index(after: comma)...])),
            let image = UIImage(data: data)
        {
            Image(uiImage: image).resizable().scaledToFill()
        } else if let url = RoutineKidsMediaURL.resolve(removeExistingImage ? nil : template?.imageUrl) {
            AsyncImage(url: url) { phase in
                if let image = phase.image { image.resizable().scaledToFill() } else { iconFallback }
            }
        } else {
            iconFallback
        }
    }

    private var iconFallback: some View {
        Image(systemName: symbol(for: icon))
            .font(.title)
            .foregroundStyle(.cyan)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func save() async {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await APIClient.shared.saveTemplate(
                id: template?.id,
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                shortLabel: shortLabel.trimmingCharacters(in: .whitespacesAndNewlines),
                icon: icon,
                durationMinutes: durationMinutes,
                imageDataURL: imageDataURL,
                removeImage: removeExistingImage
            )
            await onSaved()
            dismiss()
        } catch {
            errorMessage = String(localized: "template.save.error")
        }
    }

    private func delete() async {
        guard let template else { return }
        isWorking = true
        defer { isWorking = false }
        do {
            try await APIClient.shared.deleteTemplate(id: template.id)
            await onSaved()
            dismiss()
        } catch {
            errorMessage = String(localized: "template.delete.error")
        }
    }

    private func symbol(for icon: String) -> String {
        switch icon {
        case "moon": "moon.stars.fill"
        case "bed": "bed.double.fill"
        case "book-open": "book.fill"
        case "school": "backpack.fill"
        case "heart": "heart.fill"
        case "sun": "sun.max.fill"
        case "droplets": "drop.fill"
        default: "sparkles"
        }
    }
}
