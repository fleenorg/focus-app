import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "./youtube";

describe("parseYouTubeUrl", () => {
  it("parses standard watch URLs", () => {
    const result = parseYouTubeUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(result).toEqual({
      ok: true,
      value: { kind: "video", videoId: "dQw4w9WgXcQ" },
    });
  });

  it("parses youtu.be short links", () => {
    const result = parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ kind: "video", videoId: "dQw4w9WgXcQ" });
    }
  });

  it("parses playlist URLs as playlists", () => {
    const result = parseYouTubeUrl(
      "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGMR",
    );
    expect(result).toEqual({
      ok: true,
      value: {
        kind: "playlist",
        playlistId: "PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGMR",
      },
    });
  });

  it("treats watch URLs with a list param as the individual video", () => {
    const result = parseYouTubeUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGMR",
    );
    expect(result).toEqual({
      ok: true,
      value: { kind: "video", videoId: "dQw4w9WgXcQ" },
    });
  });

  it("parses YouTube Music URLs", () => {
    const result = parseYouTubeUrl(
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(result.ok).toBe(true);
  });

  it("parses shorts and embed paths", () => {
    expect(
      parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ").ok,
    ).toBe(true);
    expect(
      parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ").ok,
    ).toBe(true);
  });

  it("rejects non-YouTube hosts and unsafe input", () => {
    expect(parseYouTubeUrl("https://example.com/watch?v=dQw4w9WgXcQ").ok).toBe(
      false,
    );
    expect(parseYouTubeUrl('<iframe src="https://youtube.com"></iframe>').ok).toBe(
      false,
    );
    expect(parseYouTubeUrl("javascript:alert(1)").ok).toBe(false);
    expect(parseYouTubeUrl("not a url").ok).toBe(false);
  });
});
