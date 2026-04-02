import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function ThemeHarness() {
  const { theme, cycleTheme } = useTheme();

  return (
    <div>
      <span>theme:{theme}</span>
      <button onClick={cycleTheme}>cycle</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("defaults to dark and applies data-theme to html", async () => {
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(screen.getByText("theme:dark")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    });
  });

  it("hydrates localStorage and toggles between dark and light", async () => {
    window.localStorage.setItem("groundwork-theme", "light");

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(screen.getByText("theme:light")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "light");
    });

    fireEvent.click(screen.getByRole("button", { name: "cycle" }));

    expect(screen.getByText("theme:dark")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
      expect(window.localStorage.getItem("groundwork-theme")).toBe("dark");
    });
  });
});
