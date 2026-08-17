import SwiftUI
import UIKit

struct NativePhotoCropperView: View {
    @Environment(\.dismiss) private var dismiss
    let image: UIImage
    let onCropped: (String) -> Void

    @State private var zoom: CGFloat = 1
    @State private var steadyZoom: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var steadyOffset: CGSize = .zero
    @State private var previewSide: CGFloat = 1

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.035, green: 0.02, blue: 0.1).ignoresSafeArea()
                VStack(spacing: 18) {
                    GeometryReader { proxy in
                        let side = min(proxy.size.width, proxy.size.height)
                        cropContent(side: side)
                            .frame(width: side, height: side)
                            .clipShape(.rect(cornerRadius: 28))
                            .overlay {
                                RoundedRectangle(cornerRadius: 28)
                                    .stroke(.white.opacity(0.75), lineWidth: 2)
                            }
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .contentShape(.rect)
                            .gesture(dragGesture(side: side))
                            .simultaneousGesture(magnifyGesture(side: side))
                            .onAppear { previewSide = side }
                            .onChange(of: side) { _, value in
                                previewSide = value
                                offset = clamped(offset, side: value, zoom: zoom)
                                steadyOffset = offset
                            }
                    }
                    .aspectRatio(1, contentMode: .fit)

                    Text("photo.crop.hint")
                        .font(.footnote)
                        .foregroundStyle(.white.opacity(0.64))

                    Button {
                        guard let dataURL = renderDataURL() else { return }
                        onCropped(dataURL)
                        dismiss()
                    } label: {
                        Label("photo.crop.use", systemImage: "checkmark.circle.fill")
                            .font(.headline)
                            .frame(maxWidth: .infinity, minHeight: 50)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.pink)
                }
                .padding(22)
            }
            .navigationTitle("photo.crop.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("common.cancel") { dismiss() }
                }
            }
        }
    }

    private func cropContent(side: CGFloat, renderOffset: CGSize? = nil) -> some View {
        Image(uiImage: image)
            .resizable()
            .scaledToFill()
            .frame(width: side, height: side)
            .scaleEffect(max(1, zoom))
            .offset(renderOffset ?? offset)
            .clipped()
    }

    private func dragGesture(side: CGFloat) -> some Gesture {
        DragGesture()
            .onChanged { value in
                let candidate = CGSize(
                    width: steadyOffset.width + value.translation.width,
                    height: steadyOffset.height + value.translation.height
                )
                offset = clamped(candidate, side: side, zoom: zoom)
            }
            .onEnded { _ in steadyOffset = offset }
    }

    private func magnifyGesture(side: CGFloat) -> some Gesture {
        MagnifyGesture()
            .onChanged { value in
                zoom = max(1, min(4, steadyZoom * value.magnification))
                offset = clamped(offset, side: side, zoom: zoom)
            }
            .onEnded { _ in
                steadyZoom = zoom
                steadyOffset = offset
            }
    }

    private func clamped(_ candidate: CGSize, side: CGFloat, zoom: CGFloat) -> CGSize {
        let imageWidth = max(image.size.width, 1)
        let imageHeight = max(image.size.height, 1)
        let fillScale = max(side / imageWidth, side / imageHeight)
        let maximumX = max(0, (imageWidth * fillScale * zoom - side) / 2)
        let maximumY = max(0, (imageHeight * fillScale * zoom - side) / 2)
        return CGSize(
            width: min(max(candidate.width, -maximumX), maximumX),
            height: min(max(candidate.height, -maximumY), maximumY)
        )
    }

    @MainActor
    private func renderDataURL() -> String? {
        let scale = 720 / max(previewSide, 1)
        let outputOffset = CGSize(width: offset.width * scale, height: offset.height * scale)
        let renderer = ImageRenderer(
            content: cropContent(side: 720, renderOffset: outputOffset)
                .frame(width: 720, height: 720)
        )
        renderer.scale = 1
        guard let output = renderer.uiImage else { return nil }

        var quality: CGFloat = 0.86
        var data = output.jpegData(compressionQuality: quality)
        while let current = data, current.count > 1_150_000, quality > 0.35 {
            quality -= 0.1
            data = output.jpegData(compressionQuality: quality)
        }
        guard let data, data.count <= 1_200_000 else { return nil }
        return "data:image/jpeg;base64,\(data.base64EncodedString())"
    }
}
