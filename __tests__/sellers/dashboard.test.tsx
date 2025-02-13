import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "@jest/globals";
import React from "react";
import Home from "../../src/app/page";

//Broken

describe("Page", () => {
  it("renders a heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toBeDefined();
  });
});
