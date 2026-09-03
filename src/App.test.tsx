import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App Component", () => {
  it("renders heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Vite + React");
  });

  it("increments counter on click", async () => {
    const user = userEvent.setup();
    render(<App />);
    const button = screen.getByRole("button", { name: /count is 0/i });

    await user.click(button);
    expect(screen.getByRole("button", { name: /count is 1/i })).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("button", { name: /count is 2/i })).toBeInTheDocument();
  });

  it("finds elements using querySelector", () => {
    const { container } = render(<App />);
    const cardElement = container.querySelector(".card");
    const codeElement = container.querySelector("code");

    expect(cardElement).not.toBeNull();
    expect(cardElement).toBeInTheDocument();
    expect(codeElement).toHaveTextContent("src/App.tsx");
  });

  it("loads and displays users from mock API", async () => {
    render(<App />);
    expect(screen.getByText("Loading users...")).toBeInTheDocument();

    const userAlice = await screen.findByText("Alice Johnson");
    expect(userAlice).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });
});
