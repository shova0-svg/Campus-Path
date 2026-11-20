import { describe, expect, it } from "vitest";
import { campusPath, hasCampusMap, RPI_SATELLITE_EMBED } from "@/lib/campus-map";

describe("Rajshahi campus map", () => {
  it("is only shown for Rajshahi Polytechnic", () => {
    expect(hasCampusMap("rpi")).toBe(true);
    expect(hasCampusMap("dpi")).toBe(false);
    expect(hasCampusMap("bpi")).toBe(false);
  });

  it("points the satellite view at the shared campus coordinates", () => {
    expect(RPI_SATELLITE_EMBED).toContain("24.3791113,88.606811");
  });

  it("routes from the Main Gate to the Library along the main road", () => {
    expect(campusPath("main-gate", "library")).toEqual([
      "gate",
      "cross",
      "minarRoad",
      "top",
      "libraryRoad",
      "library",
    ]);
  });

  it("routes from Shaheed Minar to the Canteen beside the pond", () => {
    expect(campusPath("shaheed-minar", "canteen")).toEqual([
      "minar",
      "minarRoad",
      "cross",
      "canteenRoad",
      "canteen",
    ]);
  });

  it("needs no walking path when already inside the Academic Building", () => {
    expect(campusPath("academic-ground", "academic")).toEqual(["academic"]);
  });
});
