import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/app/shared/model/theme";
import Sidebar from "./Sidebar";

describe("Sidebar theme toggle", () => {
  it("toggles between dark and light from the header button", async () => {
    render(
      <ThemeProvider>
        <Sidebar />
      </ThemeProvider>
    );

    const button = screen.getByTitle("Switch theme (current: dark)");
    expect(button).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    });

    fireEvent.click(button);

    expect(screen.getByTitle("Switch theme (current: light)")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "light");
      expect(window.localStorage.getItem("groundwork-theme")).toBe("light");
    });
  });
});
