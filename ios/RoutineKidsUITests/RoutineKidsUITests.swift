import XCTest

@MainActor
final class RoutineKidsUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testSignedOutExperienceRemainsUsableWithLargestDynamicType() {
        let app = makeApplication(mode: "signed-out")
        app.launchEnvironment["UIPreferredContentSizeCategoryName"] =
            "UICTContentSizeCategoryAccessibilityExtraExtraExtraLarge"
        XCUIDevice.shared.orientation = .portrait
        app.launch()

        XCTAssertTrue(app.staticTexts["RoutineKids"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Se connecter"].exists)
        XCTAssertTrue(app.buttons["Mot de passe oublié"].exists)
    }

    func testFamilyBoardSupportsLandscapeAndProtectsParentSettings() {
        let app = makeApplication(mode: "board")
        XCUIDevice.shared.orientation = .landscapeLeft
        app.launch()

        XCTAssertTrue(app.staticTexts["Luna"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Noah"].exists)
        XCTAssertTrue(app.buttons["Matin"].exists)
        XCTAssertTrue(app.buttons["Soir"].exists)

        app.buttons["parent-settings-button"].tap()
        XCTAssertTrue(app.staticTexts["Espace parents"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.secureTextFields["Code parent"].exists)
    }

    private func makeApplication(mode: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-routinekids-ui-testing",
            mode == "board" ? "-routinekids-ui-testing-board" : "-routinekids-ui-testing-signed-out",
            "-AppleLanguages",
            "(fr)",
            "-AppleLocale",
            "fr_FR",
        ]
        return app
    }
}
