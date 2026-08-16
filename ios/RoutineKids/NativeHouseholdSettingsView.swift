import SwiftUI

struct NativeHouseholdSettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var locale: String
    @State private var timeZone: String
    @State private var soundsEnabled: Bool
    @State private var morningStart: Date
    @State private var morningEnd: Date
    @State private var eveningStart: Date
    @State private var eveningEnd: Date

    private let commonTimeZones = [
        "Europe/Paris", "Europe/Brussels", "Europe/London", "Europe/Zurich",
        "America/Montreal", "America/New_York", "Indian/Reunion", "Pacific/Noumea"
    ]

    init(household: Household) {
        _name = State(initialValue: household.name)
        _locale = State(initialValue: household.locale)
        _timeZone = State(initialValue: household.timeZone)
        _soundsEnabled = State(initialValue: household.soundsEnabled)
        _morningStart = State(initialValue: Self.date(from: household.morningStart))
        _morningEnd = State(initialValue: Self.date(from: household.morningEnd))
        _eveningStart = State(initialValue: Self.date(from: household.eveningStart))
        _eveningEnd = State(initialValue: Self.date(from: household.eveningEnd))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("household.section.identity") {
                    TextField("household.name", text: $name)
                    Picker("household.locale", selection: $locale) {
                        Text("Français").tag("fr")
                        Text("English").tag("en")
                    }
                    Picker("household.timezone", selection: $timeZone) {
                        if !commonTimeZones.contains(timeZone) {
                            Text(timeZone).tag(timeZone)
                        }
                        ForEach(commonTimeZones, id: \.self) { zone in
                            Text(zone.replacingOccurrences(of: "_", with: " ")).tag(zone)
                        }
                    }
                }

                Section("household.section.routines") {
                    DatePicker("household.morning.start", selection: $morningStart, displayedComponents: .hourAndMinute)
                    DatePicker("household.morning.end", selection: $morningEnd, displayedComponents: .hourAndMinute)
                    DatePicker("household.evening.start", selection: $eveningStart, displayedComponents: .hourAndMinute)
                    DatePicker("household.evening.end", selection: $eveningEnd, displayedComponents: .hourAndMinute)
                    Toggle("household.sounds", isOn: $soundsEnabled)
                }

                if let error = model.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("household.settings.title")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("common.cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("common.save") {
                        Task {
                            let saved = await model.updateHousehold(
                                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                                locale: locale,
                                timeZone: timeZone,
                                soundsEnabled: soundsEnabled,
                                morningStart: Self.time(from: morningStart),
                                morningEnd: Self.time(from: morningEnd),
                                eveningStart: Self.time(from: eveningStart),
                                eveningEnd: Self.time(from: eveningEnd)
                            )
                            if saved { dismiss() }
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || model.isWorking)
                }
            }
        }
    }

    private static func date(from value: String) -> Date {
        let parts = value.split(separator: ":").compactMap { Int($0) }
        return Calendar.current.date(
            bySettingHour: parts.first ?? 8,
            minute: parts.dropFirst().first ?? 0,
            second: 0,
            of: .now
        ) ?? .now
    }

    private static func time(from date: Date) -> String {
        let components = Calendar.current.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", components.hour ?? 0, components.minute ?? 0)
    }
}
