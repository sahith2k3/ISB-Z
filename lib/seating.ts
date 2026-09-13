export interface SeatingChartInfo {
  filename: string;
  url: string;
  courseCode: string;
  courseName?: string;
  section: string;
  campus?: "hyderabad" | "mohali";
}

export const CAMPUS_SECTIONS: Record<"hyderabad" | "mohali", string[]> = {
  hyderabad: ["A", "B", "C", "D", "E", "F"],
  mohali: ["G", "H", "I", "J", "K", "L"],
};

export function getCampusForSection(section: string): "hyderabad" | "mohali" {
  const s = section.toUpperCase().trim();
  if (["A", "B", "C", "D", "E", "F"].includes(s)) {
    return "hyderabad";
  }
  return "mohali";
}

/**
 * Generates plausible image filename patterns for a given course code and section.
 */
export function getSeatingCandidateUrls(courseCode: string, section: string): string[] {
  const c = courseCode.toUpperCase().trim();
  const s = section.toUpperCase().trim();
  const cl = courseCode.toLowerCase().trim();
  const sl = section.toLowerCase().trim();

  return [
    `/seating/${c}_${s}.jpg`,
    `/seating/${c}-${s}.jpg`,
    `/seating/${c} ${s}.jpg`,
    `/seating/${c}${s}.jpg`,
    `/seating/${c}_Sec_${s}.jpg`,
    `/seating/${c}_Section_${s}.jpg`,
    `/seating/Sec_${s}_${c}.jpg`,
    `/seating/${s}_${c}.jpg`,
    `/seating/${cl}_${sl}.jpg`,
    `/seating/${cl}-${sl}.jpg`,
    `/seating/${c}_${s}.jpeg`,
    `/seating/${c}_${s}.png`,
  ];
}

/**
 * Parses course code and section from a filename (e.g. "LSCM_G.jpg" -> { courseCode: "LSCM", section: "G" })
 */
export function parseSeatingFilename(filename: string): { courseCode: string; section: string } | null {
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "").trim();

  // Pattern 1: COURSE_SECTION (e.g. "LSCM_G" or "SWPM-K" or "PRCG H")
  const match1 = nameWithoutExt.match(/^([A-Za-z0-9]+)[\s_–-]+(?:Sec(?:tion)?[\s_–-]*)?([A-Za-z0-9]+)$/i);
  if (match1) {
    return {
      courseCode: match1[1].toUpperCase(),
      section: match1[2].toUpperCase(),
    };
  }

  // Pattern 2: SECTION_COURSE (e.g. "Sec_G_LSCM" or "G_LSCM")
  const match2 = nameWithoutExt.match(/^(?:Sec(?:tion)?[\s_–-]*)?([A-Za-z0-9]+)[\s_–-]+([A-Za-z0-9]+)$/i);
  if (match2) {
    const part1 = match2[1].toUpperCase();
    const part2 = match2[2].toUpperCase();
    if (part1.length === 1 && part2.length > 1) {
      return { courseCode: part2, section: part1 };
    }
    return { courseCode: part1, section: part2 };
  }

  // Pattern 3: Concatenated (e.g. "LSCMG" -> 4-letter course + 1-letter section)
  const match3 = nameWithoutExt.match(/^([A-Za-z]{3,5})([A-Za-z])$/i);
  if (match3) {
    return {
      courseCode: match3[1].toUpperCase(),
      section: match3[2].toUpperCase(),
    };
  }

  return null;
}
