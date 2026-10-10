# Flight booking cross-browser tests

Automated positive and negative checks for the Rahul Shetty Academy flight booking practice page:
`https://rahulshettyacademy.com/dropdownsPractise/`

The project intentionally keeps the runners separate: JavaScript tests use Playwright Test, while
the Selenium suite is C# because NUnit is a .NET test framework.

## Coverage

Both suites contain 15 positive scenarios and 5 negative scenarios, each with assertions. Coverage
includes trip type, airport choices, country autocomplete, passenger counts and limits, currency,
fare preferences, and default dates.

Playwright runs against installed Google Chrome, Brave, and Playwright's WebKit engine (Safari
compatibility coverage). Selenium/NUnit runs against Chrome, Brave, or native Safari, selected by
the `BROWSER` environment variable.

## Prerequisites

- Node.js 22 or newer
- .NET SDK 10
- Google Chrome and Brave installed
- Playwright WebKit browser installed with `npx playwright install webkit`
- For native Safari Selenium: macOS and Safari WebDriver enabled with `safaridriver --enable`

Brave's executable path can be overridden with `BRAVE_BIN`.

## Run Playwright

```sh
npm ci
npx playwright install webkit
npm test
```

Run headed (visible browser windows):

```sh
npm run test:headed
```

Run one browser project:

```sh
npm run test:chrome
npm run test:brave
npm run test:safari
```

The HTML report is written to `playwright-report/`.

## Run Selenium with NUnit

```sh
dotnet test tests/selenium/BookingTests.csproj
```

Chrome is the default. Select another browser with:

```sh
BROWSER=brave dotnet test tests/selenium/BookingTests.csproj
BROWSER=safari dotnet test tests/selenium/BookingTests.csproj
```

Selenium runs headed by default. Native Safari WebDriver only runs on macOS.

## CI

GitHub Actions runs the Playwright suite on Chrome, Brave, and WebKit and the Selenium/NUnit suite
in a Chrome/Brave/Safari matrix on macOS. It runs on pushes to `main`, pull requests, and manual
dispatches.
