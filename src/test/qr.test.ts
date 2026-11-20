import { describe, expect, it } from "vitest";
import { buildingQrPayload, decodeQr, qrFileName, roomQrPayload, shareUrl } from "@/lib/qr";

describe("Building QR codes", () => {
  it("encodes and decodes a building checkpoint", () => {
    const payload = buildingQrPayload("rpi", "academic");
    expect(payload).toBe("SOHOJ1|rpi|academic|building");
    expect(decodeQr(payload)).toEqual({
      instituteId: "rpi",
      buildingId: "academic",
      kind: "building",
    });
  });

  it("encodes and decodes a room checkpoint", () => {
    expect(decodeQr(roomQrPayload("rpi", "academic", "1305"))).toEqual({
      instituteId: "rpi",
      buildingId: "academic",
      kind: "room",
      room: "1305",
    });
  });

  it("reads a shared link carrying the QR payload", () => {
    const url = shareUrl(buildingQrPayload("rpi", "admin"));
    expect(decodeQr(url)).toEqual({
      instituteId: "rpi",
      buildingId: "admin",
      kind: "building",
    });
  });

  it("rejects invalid codes and room codes without a number", () => {
    expect(decodeQr("")).toBeNull();
    expect(decodeQr("SOHOJ1|rpi|academic")).toBeNull();
    expect(decodeQr("SOHOJ1|rpi|academic|room")).toBeNull();
    expect(decodeQr("random text")).toBeNull();
  });

  it("names downloaded QR files by institute and building", () => {
    expect(qrFileName({ instituteId: "rpi", buildingId: "academic", kind: "building" })).toBe(
      "sohoj-rpi-academic.png",
    );
  });
});
