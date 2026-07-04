/**
 * Format the short "welcome" name displayed on the Dashboard.
 *
 * Rules (in order):
 *   1. Split the stored full_name on whitespace.
 *   2. If the FIRST token, once normalized (lowercased & stripped of periods/commas),
 *      is a common honorific title OR a single letter (e.g. "J"), then return the
 *      first token followed by the second token — preserving original casing.
 *   3. Otherwise return just the first token.
 *   4. If the string is empty / missing / has no letters, return "".
 *
 * Examples:
 *   "Dr Brandt Gibson"    -> "Dr Brandt"
 *   "Dr. Brandt Gibson"   -> "Dr. Brandt"
 *   "J. R. Tolkien"       -> "J. R."      (single-letter first token → include second)
 *   "Rev. Martin Luther"  -> "Rev. Martin"
 *   "Brandt Gibson"       -> "Brandt"
 *   "drgibson"            -> "drgibson"   (email-prefix style single token)
 *   ""  / null / undefined -> ""
 */

// Common English honorifics. Compared after lowercasing and stripping trailing "." / ","
const TITLES = new Set([
    "dr", "dr.", // usually normalized to "dr" but leave both for safety
    "mr",
    "mrs",
    "ms",
    "miss",
    "mx",
    "prof",
    "professor",
    "rev",
    "reverend",
    "fr", // Father
    "sr", // Senior / Señor / Sister
    "jr", // Junior
    "sir",
    "dame",
    "lord",
    "lady",
    "hon", // Honorable
    "capt",
    "captain",
    "lt",
    "sgt",
    "col",
    "gen",
    "maj",
    "cmdr",
    "pastor",
    "rabbi",
    "imam",
    "st", // Saint
]);

export function formatWelcomeName(fullName) {
    if (!fullName || typeof fullName !== "string") return "";

    const tokens = fullName.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return "";
    if (tokens.length === 1) return tokens[0];

    const first = tokens[0];
    const normalized = first.toLowerCase().replace(/[.,]/g, "");
    const isTitle = TITLES.has(normalized);
    const isSingleLetter = /^[a-z]\.?$/i.test(first);

    if (isTitle || isSingleLetter) {
        return `${first} ${tokens[1]}`;
    }
    return first;
}
