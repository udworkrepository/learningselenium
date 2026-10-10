using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Safari;
using OpenQA.Selenium.Support.UI;

namespace BookingTests;

[TestFixture]
[Category("CrossBrowser")]
public sealed class BookingTests
{
    private const string Url = "https://rahulshettyacademy.com/dropdownsPractise/";
    private IWebDriver driver = null!;

    [SetUp]
    public void SetUp()
    {
        var browser = Environment.GetEnvironmentVariable("BROWSER")?.ToLowerInvariant() ?? "chrome";
        driver = browser switch
        {
            "chrome" => CreateChromeDriver(new ChromeOptions()),
            "brave" => CreateBraveDriver(),
            "safari" => new SafariDriver(new SafariOptions { PageLoadStrategy = PageLoadStrategy.Eager }),
            _ => throw new ArgumentException($"Unsupported BROWSER value '{browser}'. Use chrome, brave, or safari.")
        };
        driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(2);
        driver.Manage().Window.Maximize();
        driver.Navigate().GoToUrl(Url);
    }

    [TearDown]
    public void TearDown()
    {
        driver?.Quit();
        driver?.Dispose();
    }

    [Test]
    public void Positive_BookingPageLoadsWithOneWaySelected()
    {
        Assert.That(driver.Title, Does.Contain("QAClickJet"));
        Assert.That(driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_0")).Selected, Is.True);
    }

    [Test]
    public void Positive_DepartureListContainsMumbai()
    {
        var field = AirportField("ctl00_mainContent_ddl_originStation1");
        if (field.TagName.Equals("select", StringComparison.OrdinalIgnoreCase))
        {
            Assert.That(new SelectElement(field).Options.Select(option => option.Text), Does.Contain("Mumbai (BOM)"));
            return;
        }

        field.Click();
        field.SendKeys("Mumbai");
        Assert.That(new WebDriverWait(driver, TimeSpan.FromSeconds(5))
            .Until(_ => driver.FindElements(By.CssSelector("#glsctl00_mainContent_ddl_originStation1_CTNR a[value='BOM']"))
                .FirstOrDefault(element => element.Displayed)),
            Is.Not.Null);
    }

    [Test]
    public void Positive_SelectingMumbaiLoadsArrivalChoices()
    {
        ChooseAirport("ctl00_mainContent_ddl_originStation1", "Mumbai (BOM)");
        var field = AirportField("ctl00_mainContent_ddl_destinationStation1");
        if (field.TagName.Equals("select", StringComparison.OrdinalIgnoreCase))
        {
            Assert.That(new SelectElement(field).Options.Select(option => option.Text), Does.Contain("Delhi (DEL)"));
            return;
        }

        field.Click();
        Assert.That(new WebDriverWait(driver, TimeSpan.FromSeconds(5))
            .Until(_ => driver.FindElements(By.CssSelector("#glsctl00_mainContent_ddl_destinationStation1_CTNR a[value='DEL']"))
                .FirstOrDefault(element => element.Displayed)),
            Is.Not.Null);
    }

    [Test]
    public void Positive_ArrivalAutocompleteOffersDelhiAfterDepartureIsSelected()
    {
        ChooseAirport("ctl00_mainContent_ddl_originStation1", "Mumbai (BOM)");
        var field = AirportField("ctl00_mainContent_ddl_destinationStation1");
        if (field.TagName.Equals("select", StringComparison.OrdinalIgnoreCase))
        {
            Assert.That(new SelectElement(field).Options.Select(option => option.Text), Does.Contain("Delhi (DEL)"));
        }
        else
        {
            field.Click();
            field.SendKeys("Delhi");
            Assert.That(new WebDriverWait(driver, TimeSpan.FromSeconds(5))
                .Until(_ => driver.FindElements(By.CssSelector(
                        "#glsctl00_mainContent_ddl_destinationStation1_CTNR a[value='DEL']"))
                    .FirstOrDefault(element => element.Displayed)), Is.Not.Null);
        }
    }

    [Test]
    public void Positive_RoundTripCanBeSelected()
    {
        driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_1")).Click();
        Assert.That(driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_1")).Selected, Is.True);
    }

    [Test]
    public void Positive_OneWayCanBeSelected()
    {
        driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_1")).Click();
        driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_0")).Click();
        Assert.That(driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_0")).Selected, Is.True);
    }

    [Test]
    public void Positive_MulticityCanBeSelected()
    {
        driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_2")).Click();
        Assert.That(driver.FindElement(By.Id("ctl00_mainContent_rbtnl_Trip_2")).Selected, Is.True);
    }

    [Test]
    public void Positive_USDCurrencyCanBeSelected()
    {
        Select(driver, "ctl00_mainContent_DropDownListCurrency", "USD");
        Assert.That(new SelectElement(driver.FindElement(By.Id("ctl00_mainContent_DropDownListCurrency"))).SelectedOption.GetAttribute("value"),
            Is.EqualTo("USD"));
    }

    [Test]
    public void Positive_AEDCurrencyCanBeSelected()
    {
        Select(driver, "ctl00_mainContent_DropDownListCurrency", "AED");
        Assert.That(new SelectElement(driver.FindElement(By.Id("ctl00_mainContent_DropDownListCurrency"))).SelectedOption.GetAttribute("value"),
            Is.EqualTo("AED"));
    }

    [Test]
    public void Positive_FarePreferencesCanBeEnabled()
    {
        foreach (var id in new[]
        {
            "ctl00_mainContent_chk_friendsandfamily",
            "ctl00_mainContent_chk_SeniorCitizenDiscount",
            "ctl00_mainContent_chk_StudentDiscount",
            "ctl00_mainContent_chk_IndArm"
        })
        {
            var checkbox = driver.FindElement(By.Id(id));
            if (!checkbox.Selected)
            {
                checkbox.Click();
            }
            Assert.That(checkbox.Selected, Is.True, id);
        }
    }

    [Test]
    public void Positive_CountryAutocompleteSelectsIndia()
    {
        var country = driver.FindElement(By.Id("autosuggest"));
        country.SendKeys("Ind");
        new WebDriverWait(driver, TimeSpan.FromSeconds(5))
            .Until(_ => driver.FindElements(By.CssSelector(".ui-menu-item"))
                .Any(item => item.Text.Trim() == "India"));
        driver.FindElements(By.CssSelector(".ui-menu-item"))
            .Single(item => item.Text.Trim() == "India")
            .Click();
        Assert.That(country.GetAttribute("value"), Is.EqualTo("India"));
    }

    [Test]
    public void Positive_AdultPassengerCountCanBeIncreased()
    {
        OpenPassengers();
        ClickPassengerIncrement("hrefIncAdt");
        driver.FindElement(By.Id("btnclosepaxoption")).Click();
        Assert.That(driver.FindElement(By.Id("divpaxinfo")).Text, Does.Contain("2 Adult"));
    }

    [Test]
    public void Positive_ChildPassengerCountCanBeIncreased()
    {
        OpenPassengers();
        ClickPassengerIncrement("hrefIncChd");
        driver.FindElement(By.Id("btnclosepaxoption")).Click();
        Assert.That(driver.FindElement(By.Id("divpaxinfo")).Text, Does.Contain("1 Child"));
    }

    [Test]
    public void Positive_InfantPassengerCountCanBeIncreased()
    {
        OpenPassengers();
        ClickPassengerIncrement("hrefIncInf");
        driver.FindElement(By.Id("btnclosepaxoption")).Click();
        Assert.That(driver.FindElement(By.Id("divpaxinfo")).Text, Does.Contain("1 Infant"));
    }

    [Test]
    public void Positive_DepartureAndReturnDateControlsAreAvailable()
    {
        var departureDate = driver.FindElement(By.Id("ctl00_mainContent_view_date1"));
        var returnDate = driver.FindElement(By.Id("ctl00_mainContent_view_date2"));
        Assert.That(departureDate.Displayed, Is.True);
        Assert.That(departureDate.Enabled, Is.True);
        Assert.That(returnDate.Displayed, Is.True);
        Assert.That(returnDate.Enabled, Is.True);
    }

    [Test]
    public void Negative_ArrivalChoicesUnavailableBeforeDepartureIsChosen()
    {
        var field = AirportField("ctl00_mainContent_ddl_destinationStation1");
        if (field.TagName.Equals("select", StringComparison.OrdinalIgnoreCase))
        {
            Assert.That(new SelectElement(field).Options, Has.Count.EqualTo(1));
        }
        else
        {
            Assert.That(field.GetAttribute("value"), Is.EqualTo("Arrival City"));
            Assert.That(field.GetAttribute("selectedvalue"), Is.Empty);
        }
    }

    [Test]
    public void Negative_AdultCountCannotBeReducedBelowOne()
    {
        OpenPassengers();
        Assert.That(driver.FindElement(By.Id("hrefDecAdt")).GetAttribute("class"), Does.Contain("pax-disabled"));
        Assert.That(driver.FindElement(By.Id("spanAudlt")).Text, Is.EqualTo("1"));
    }

    [Test]
    public void Negative_ChildCountCannotBeReducedBelowZero()
    {
        OpenPassengers();
        Assert.That(driver.FindElement(By.Id("hrefDecChd")).GetAttribute("class"), Does.Contain("pax-disabled"));
        Assert.That(driver.FindElement(By.Id("spanChild")).Text, Is.EqualTo("0"));
    }

    [Test]
    public void Negative_MoreThanNinePassengersShowsValidationAlert()
    {
        OpenPassengers();
        for (var count = 1; count < 9; count++)
        {
            driver.FindElement(By.Id("hrefIncAdt")).Click();
        }
        driver.FindElement(By.Id("hrefIncAdt")).Click();
        var alert = new WebDriverWait(driver, TimeSpan.FromSeconds(3)).Until(_ => driver.SwitchTo().Alert());
        Assert.That(alert.Text, Does.Contain("maximum of 9 passengers"));
        alert.Accept();
    }

    [Test]
    public void Negative_UnmatchedCountryTextDoesNotOfferSelection()
    {
        driver.FindElement(By.Id("autosuggest")).SendKeys("not-a-real-country-xyz");
        Assert.That(driver.FindElements(By.CssSelector(".ui-autocomplete .ui-menu-item")), Is.Empty);
    }

    private static ChromeDriver CreateBraveDriver()
    {
        var options = new ChromeOptions();
        var bravePath = Environment.GetEnvironmentVariable("BRAVE_BIN");
        if (string.IsNullOrWhiteSpace(bravePath))
        {
            bravePath = OperatingSystem.IsMacOS()
                ? "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
                : OperatingSystem.IsWindows()
                    ? @"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
                    : "/usr/bin/brave-browser";
        }
        options.BinaryLocation = bravePath;
        options.PageLoadStrategy = PageLoadStrategy.Eager;
        return new ChromeDriver(options);
    }

    private static ChromeDriver CreateChromeDriver(ChromeOptions options)
    {
        options.PageLoadStrategy = PageLoadStrategy.Eager;
        return new ChromeDriver(options);
    }

    private static void Select(IWebDriver webDriver, string id, string label) =>
        new SelectElement(webDriver.FindElement(By.Id(id))).SelectByText(label);

    private IWebElement AirportField(string selectId)
    {
        var legacy = driver.FindElements(By.Id(selectId)).FirstOrDefault(element => element.Displayed);
        return legacy ?? driver.FindElement(By.Id($"{selectId}_CTXT"));
    }

    private void ChooseAirport(string id, string label)
    {
        var field = AirportField(id);
        var code = label[(label.LastIndexOf('(') + 1)..^1];
        if (field.TagName.Equals("select", StringComparison.OrdinalIgnoreCase))
        {
            new SelectElement(field).SelectByText(label);
            return;
        }

        var city = label[..label.LastIndexOf(" (", StringComparison.Ordinal)];
        field.Click();
        field.SendKeys(city);
        new WebDriverWait(driver, TimeSpan.FromSeconds(5))
            .Until(_ => driver.FindElements(By.CssSelector($"#gls{id}_CTNR a[value='{code}']"))
                .FirstOrDefault(element => element.Displayed))
            .Click();
    }

    private void OpenPassengers()
    {
        driver.FindElement(By.Id("divpaxinfo")).Click();
        new WebDriverWait(driver, TimeSpan.FromSeconds(5))
            .Until(_ => driver.FindElement(By.Id("divpaxOptions")).GetCssValue("opacity") == "1");
    }

    private void ClickPassengerIncrement(string id)
    {
        new WebDriverWait(driver, TimeSpan.FromSeconds(5)).Until(_ =>
        {
            var control = driver.FindElement(By.Id(id));
            return control.Displayed && control.Enabled && control.GetAttribute("class")?.Contains("pax-enabled") == true;
        });
        driver.FindElement(By.Id(id)).Click();
    }
}
