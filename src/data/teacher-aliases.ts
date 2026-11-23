/**
 * 1st-shift routine notices print English spellings; the faculty directory uses
 * Bangla. These are manually verified name aliases (notice spelling → directory
 * name). Only exact, unambiguous matches go here — never the acronym.
 * Phone matches in resolveTeacher() take priority over these.
 */
export const TEACHER_ALIASES: Record<string, string> = {
  "MD. ABDULLAH-AL MAMUN": "মোঃআব্দুল্লাহ-আল-মামুন",
  "MST. RABEYA SIDDIQUA": "মোছাঃ রাবেয়া সিদ্দিকা",
  "MD. SHIMUL HOSSAIN": "মোহাঃ শিমুল হোসেন",
  "MD. ABDUR RAZZAK": "মোঃ আব্দুর রাজ্জাক",
  "SYED MAHMUDUN NABI KHONDKER": "সৈয়দ মাহমুদুন নবী খন্দকার",
  "MD. FARUQ HOSSAIN": "মোঃ ফারুক হোসেন",
  "MST. NAZMUN NAHER": "মোসাঃ নাজমুন নাহার",
  "MD. AZIZUL AMAN AL AMIN": "প্রকৌশলী মোঃ আজিজুল আমান আল আমিন",
  "MD. NURUN NOBE": "মোঃ নুরুন্নবী",
  "MST. RIYA KHATUN": "মোছাঃ রিয়া খাতুন",
  "MD. SOHEL PARVAGE": "মোঃ সোহেল পারভেজ",
  "MD. FAZLUL HAQUE": "মোঃ ফজলুল হক",
};

/** Unconfirmed candidates — shown in the match report only, never auto-applied. */
export const UNCONFIRMED_ALIASES: Record<string, string[]> = {
  "SAMROZ NAHAR": [],
  "ANJUMAN ARA": ["মোসাঃ ইসমত আরা", "মোসাঃ সারমিন আরা"],
  "MD. SORIAT ULLAH": ["মোঃ শরিয়ত উল্লা"],
  "SYEDA SADIKA AKHTER JAHAN": [],
  "MD. MOHON ALI": [], // keep separate from Mohammad Ali (MA collision)
  "MD. MOHOSIN": ["মোঃ মহসিন", "মোঃ মুহসিন"],
};
