import { it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "../i18n";
import Onboarding from "../pages/Onboarding";
import { useApp } from "../store/useApp";
afterEach(() => {
  cleanup();
  useApp.setState({ profile: null });
});
it("creates a profile after three introduction slides", () => {
  render(<Onboarding />);
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText("Keyingi"));
  fireEvent.change(screen.getByLabelText("Ism yoki taxallus"), {
    target: { value: "Aziz" },
  });
  fireEvent.click(screen.getByText("Boshladik!"));
  expect(useApp.getState().profile).toMatchObject({
    name: "Aziz",
    goal: 1200000,
  });
});
