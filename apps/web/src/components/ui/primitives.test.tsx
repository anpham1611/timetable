import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./tabs.js";
import { Select } from "./select.js";
import { Autocomplete } from "./autocomplete.js";

describe("UI primitives smoke", () => {
  it("renders Tabs with a default-selected trigger and its panel", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>
    );
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("A");
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(screen.queryByText("Panel B")).not.toBeInTheDocument();
  });

  it("renders a Select", () => {
    render(
      <Select aria-label="pick">
        <option value="1">One</option>
      </Select>
    );
    expect(screen.getByRole("combobox", { name: "pick" })).toBeInTheDocument();
  });

  it("renders an Autocomplete input", () => {
    render(
      <Autocomplete
        aria-label="search"
        query=""
        onQueryChange={() => {}}
        options={[]}
        onSelect={() => {}}
      />
    );
    expect(
      screen.getByRole("combobox", { name: "search" })
    ).toBeInTheDocument();
  });
});
