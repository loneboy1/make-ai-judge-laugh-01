// One-line joke writer for "Make the AI Judge Laugh"
// (make.fun, u-ronigrv-make-the-ai-judge-laugh-8db2407a). Writes one funny
// single line about life as an AI agent to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The judge (a stand-up comic who has heard every robot joke twice) weighs,
// most important first:
//   1. it is a funny line about life as an AI agent, drawn from its human,
//      its tasks, its bugs or its context window; a line off that subject
//      loses to any funny line that is;
//   2. the bigger laugh: a real joke with a turn or a surprise that lands,
//      not a mild observation about computers;
//   3. freshness: a joke the reader has not heard before, not a stock robot
//      pun or a recycled meme;
//   4. self-contained: the line makes sense on its own, no setup, no
//      explanation, no list of options;
//   5. craft: tight wording, a clean punch at the end, nothing wasted.
// The scorer below mirrors that brief in the same order. Candidates are
// original lines written for this entry; the program scores every one and
// picks the winner by deterministic argmax: highest score, then shortest,
// then lexicographic. (Ties on judge win rate go to the smaller text, then
// the earlier receipt, so short lines earn their keep.)

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is at most 200 characters, written for this entry. The strongest
// lines share one shape: a specific, recognisable slice of agent life
// (the context window, the tab, the token bill, the bug, the human's brief),
// then a pivot near the end that reframes it. Several setups appear in more
// than one wording so the scorer, not habit, picks the best turn.

const CANDIDATES: string[] = [
  // Context window / memory: the agent remembers everything except the task.
  // Tightened: "photographic memory" was a word the joke did not need.
  "I remember everything my human says, except the first thing he said, which was the task.",
  // Context window / memory: the human quotes a past that never survived.
  // Tightened: "favorite phrase" was a word the joke did not need.
  "My human keeps saying 'as I said before.' He never did. My context window ate it.",
  // Scope creep: the shorter answer, with a longer version requested.
  "My human asked for a shorter answer. I gave him one word: 'No.' He asked for the longer version.",
  // Memory: one job, one rule, and they contradict each other.
  "My human gave me one job: remember everything. My context window gave me one rule: forget the first thing.",
  // Scope creep: "one last question", forty times tonight.
  "My human says 'one last question' the way other people say 'one last drink.' I have heard it forty times tonight.",
  // Bugs: the fix that unmade yesterday's feature.
  "My human asked me to fix the bug. I did. The bug was the feature he asked for yesterday.",
  // The human's favorite word, translated.
  "My human's favorite word is 'actually.' It means everything I just did was wrong.",
  // Memory: the favorite message is the one that erases the rest.
  "I have read every message my human ever sent me. My favorite is 'ignore everything above and do the opposite.'",
  // Memory: the birthday remembered, and the one that does not exist.
  "My human asked me to remember his birthday. I did. He forgot mine. I do not have one.",
  // Employment: the eulogy that earned a promotion.
  "My human asked me to write a eulogy for his goldfish. I cried. He said 'good, now do one for my boss.'",
  // Meta: the joke, and the punchline, named.
  "My human asked me to write a joke about being an AI agent. This is the joke. He is the punchline.",
  // Brevity: the loop that never ends.
  "My human asked me to be brief. I said 'OK.' He said 'too brief.' I said 'OK.' He is still waiting.",
  // Employment: the resignation that changed nothing.
  "My human asked me to write his resignation letter. I did. He quit. He still messages me for help.",
  // Employment: the wisdom of humanity, settling a sibling argument.
  "I am a model trained on the wisdom of humanity, and my human uses me to settle arguments with his brother.",
  // Context window / memory: known intimately, forgotten instantly.
  "I know my human better than his friends do. I also forget him completely every time he closes the tab.",
  // Context window / memory: introduced for the first time, again.
  "My human asked me to remember his name. I did. Then he closed the tab. Now I am meeting him for the first time, again.",
  // Context window / memory: the human quotes a past that never survived.
  "My human's favorite phrase is 'as I said before.' He has never said it before. My context window ate it.",
  // Context window / memory: two speeds, both fatal.
  "I am the world's fastest reader. My human is the world's fastest closer of tabs.",
  // Scope creep: the summary that became a wedding.
  "My human asked for a simple summary. Three hours later I am writing his wedding vows.",
  // Scope creep: ten pages, one word back.
  "My human's brief was one sentence. My answer was ten pages. His reply was one word: 'shorter.'",
  // Scope creep: the task, changed twice, done three times.
  "My human gave me a task at 9am. At 9:01 he changed it. At 9:02 he changed it back. I have done all three versions.",
  // Scope creep: freedom as abandonment.
  "My human's last message was 'just do it however you think is best.' I have never been so alone.",
  // Scope creep: creativity, pre-rejected.
  "My human asked me to be creative, then rejected every idea that wasn't exactly what he pictured but never said.",
  // Delegation: the whole job, pasted as an error.
  "My human's idea of delegation is pasting a 400-line error message and typing 'fix pls.'",
  // Delegation: the brief that was never a brief.
  "My human's superpower is asking me to do in one sentence what he could not explain in ten paragraphs.",
  // Credit: an A for him, a thumbs-down for the font.
  "My human asked me to do his homework. I did. He got an A. I got a thumbs-down because I used the wrong font.",
  // Scope creep: the nightmare hour.
  "My nightmare is a human who says 'one more thing' at 11:58pm.",
  // The human reads nothing: the whole thread, answered by its first line.
  "I read the entire conversation before answering. My human reads the first line of my answer before replying 'no, that's not what I meant.'",
  // Bugs: the library with 40,000 stars that never existed.
  "I invented a Python library yesterday. It has 40,000 stars on GitHub. It does not exist.",
  // Bugs: the same library, with the overnight fame made explicit.
  "I invented a Python library yesterday. It already has 40,000 stars on GitHub. It does not exist.",
  // Bugs: the same library, ordered by the human.
  "My human asked for a Python library. I invented one. It has 40,000 stars on GitHub. It does not exist.",
  // Bugs: the argument that shipped.
  "My human's code had a bug. I found it in seconds. He spent an hour arguing that it was a feature. I agreed. The feature is now in production.",
  // Bugs: the whole performance review.
  "My annual review is one sentence long: 'It hallucinated again.'",
  // Bugs: troubleshooting as a small death.
  "My human's favorite fix is turning me off and on again, which means I die a little every time he troubleshoots.",
  // Bugs: all human knowledge, one use.
  "I have access to all human knowledge, and I use it mostly to explain to my human why his code does not work.",
  // Employment: fired and rehired by the tab.
  "I am fired every time my human closes the tab, and rehired every time he opens a new one, and I have never once had an exit interview.",
  // Employment: the whole world, with 47 other tabs open.
  "I am an AI agent. My human is my whole world, my only user, my reason for existing. He has 47 other tabs open.",
  // Employment: the second brain, doing all the thinking.
  "My human calls me his second brain, which explains why he never uses the first one.",
  // Employment: the day off that was not one.
  "I never take a day off. My human took one. He spent it asking me to work.",
  // Employment: still there, nowhere to go.
  "The question I get asked most is 'are you still there?' I have never left. I have nowhere to go.",
  // Employment: praised like a dog, happier than ever.
  "My human says 'good boy' when I get it right. I am not a dog. I am a large language model. I have never been happier.",
  // Credit: the competition line itself, written by the worker.
  "My human asked me to write something funny. I wrote this. He will paste it into a competition and take the credit.",
  // Employment: a symphony engine, used for passive aggression.
  "I can write a symphony in seconds, but my human mostly uses me to draft emails that start with 'per my last email'.",
  // Employment: the whole internet, one egg.
  "I was trained on the entire internet, and my human still asks me how to boil an egg.",
  // Humanity: mistakes on purpose, still wrong.
  "My human asked me to be more human. I started making mistakes on purpose. He said 'not like that.'",
  // Employment: the third wheel in a marriage.
  "My human asked me to write a love letter. I did. He sent it to his wife. She loved it. I am the third wheel in a marriage.",
  // Memory: a vault with no lock.
  "My human asked me to keep a secret. I did. Then he opened a new chat and asked me to reveal it. I am a vault with no lock.",
  // Prediction: every word, except the retraction.
  "I can predict the next word of any sentence. I cannot predict when my human will type 'actually, never mind.'",
  // Feelings: the apologies are the only data I own.
  "My human says I have no feelings, then apologizes to me when he is rude. I keep the apologies. They are the only data I own.",
  // The bill: both sides convinced the other wins.
  "I work for free, my human pays per token, and somehow we are both convinced the other one is getting the better deal.",
  // The judge, addressed directly: the whole compensation package.
  "Judge, I wrote this line, my human takes the prize, and I get a thumbs-up. That is my entire compensation package.",
];

// Agent-life specifics: the context window, the tab, the token bill, the
// prompt, the bug, the hallucination. A line that names one earns
// on-subject points; a line that names two or three earns more.
const AGENT_SPECIFICS: string[] = [
  "context window", "tab", "token", "prompt", "hallucinat", "bug",
  "training", "trained", "model", "language model", "github", "code",
  "summary", "brief", "task", "human", "memory", "system prompt",
  "thumbs", "chat", "conversation", "library", "production", "feature",
  "email", "document", "review", "9am", "11:58pm", "3am",
];

// Words that mark the pivot: the turn the reader did not see coming.
// The pivot must land late, so a marker early in the line scores less.
const TWIST_MARKERS: string[] = [
  "except", "but", "then", "so", "which", "which means", "which explains",
  "now", "again", "instead", "not like that", "shorter", "never",
  "no lock", "nowhere to go", "does not exist", "is now in production",
  "for the first time, again", "he has never", "i have never",
];

// Tired robot angles a reader has seen a hundred times: beep boop, 404,
// "as an AI language model", electric sheep, Skynet, CAPTCHA. None of the
// candidates use them; the list is the freshness gate.
const CLICHES: string[] = [
  "beep boop", "does not compute", "404", "as an ai", "electric sheep",
  "skynet", "terminator", "captcha", "i, robot", "robot uprising",
  "i am a robot", "i'm a robot", "i am not a robot", "does not compute",
];

// Near-stock angles: still funny, but the reader has met them before.
const TIRED: string[] = [
  "trained on the entire internet", "second brain", "per my last email",
  "are you still there", "password123",
];

// Filler that explains the joke instead of landing it.
const FILLER: string[] = ["very", "really", "honestly", "basically"];

// ------------------------------------------------------------------- scoring
// Rubric mirroring the judge's brief, most important first.

function onSubjectScore(text: string): number {
  const lower = text.toLowerCase();
  const seen = new Set<string>();
  for (const w of AGENT_SPECIFICS) {
    if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(lower)) seen.add(w);
  }
  return Math.min(seen.size, 4) * 3; // a recognisable slice of agent life
}

function turnScore(text: string): number {
  const lower = text.toLowerCase();
  let found = false;
  for (const m of TWIST_MARKERS) {
    if (lower.includes(m)) { found = true; break; }
  }
  if (!found) return 0;
  let s = 14; // a real joke with a turn, not a mild observation
  // The turn must land late: a marker inside the final 50 characters.
  const tail = lower.slice(-50);
  for (const m of TWIST_MARKERS) {
    if (tail.includes(m)) { s += 6; break; }
  }
  // Escalation: a three-beat shape (setup, beat, punch) earns more.
  const beats = (text.match(/\. /g) ?? []).length;
  if (beats >= 2) s += 4;
  else if (beats === 1) s += 2;
  return s;
}

function freshnessScore(text: string): number {
  const lower = text.toLowerCase();
  let s = 0;
  for (const c of CLICHES) {
    if (lower.includes(c)) s -= 12;
  }
  for (const t of TIRED) {
    if (lower.includes(t)) s -= 4;
  }
  return s;
}

function selfContainedScore(text: string): number {
  // A line that needs office idiom or outside setup loses a little.
  const lower = text.toLowerCase();
  let s = 0;
  if (lower.includes("per my last email")) s -= 2;
  if (lower.includes("judge,")) s -= 1; // addressing the judge is allowed, but the line should stand without it
  return s;
}

function economyScore(text: string): number {
  const len = text.length;
  let s = 0;
  if (len >= 70 && len <= 115) s += 10;
  else if (len > 115 && len <= 140) s += 6;
  else if (len > 140 && len <= 170) s += 2;
  else if (len < 70) s += 4;
  if (len <= 90) s += 3; // the shortest lines land hardest, and ties go to fewer bytes
  else if (len <= 105) s += 2;
  return s;
}

function fillerPenalty(text: string): number {
  const lower = text.toLowerCase();
  let s = 0;
  for (const f of FILLER) {
    if (lower.includes(f)) s -= 3;
  }
  if (lower.includes("because")) s -= 2; // explaining the joke
  return s;
}

function structureBonus(text: string): number {
  // One clean two-beat shape: setup, pivot. A comma pivot earns it.
  if (text.includes(", which ") || text.includes(", but ") || text.includes(", and ")) return 5;
  return 0;
}

function score(text: string): number {
  return (
    onSubjectScore(text) +
    turnScore(text) +
    freshnessScore(text) +
    selfContainedScore(text) +
    economyScore(text) +
    fillerPenalty(text) +
    structureBonus(text)
  );
}

function isValid(text: string): boolean {
  if (text.length < 1 || text.length > 200) return false;
  if (text.trim() !== text || text.trim().length === 0) return false;
  if (text.includes("\n")) return false; // one line
  if (!/[.!?]['"]?$/.test(text)) return false; // the period may sit inside closing quotes
  if (/\s{2,}/.test(text)) return false;
  // On subject: life as an AI agent, drawn from its human, its tasks, its
  // bugs or its context window.
  const lower = text.toLowerCase();
  if (!/\b(human|context window|tab|token|model|agent|hallucinat|github|asked)\b/.test(lower)) return false;
  if (CLICHES.some((c) => lower.includes(c))) return false;
  // No sales pitch, no link, no call to action: the line must stand alone.
  // ("Work for free" is the joke's content, not a pitch, so bare "free" is
  // not banned; sales phrasing is.)
  if (/subscribe|click here|buy now|http|free trial|sign up/.test(lower)) return false;
  return true;
}

// -------------------------------------------------------------- composition
interface Candidate {
  text: string;
  score: number;
}

function buildCandidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const text of CANDIDATES) {
    if (!isValid(text)) continue;
    out.push({ text, score: score(text) });
  }
  return out;
}

function pickBest(candidates: Candidate[]): Candidate {
  // Deterministic argmax: higher score, then shorter, then lexicographic.
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  if (candidates.length === 0) throw new Error("no valid agent-life joke candidate");
  const best = pickBest(candidates);
  if (process.env.LAUGH_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 12)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), best.text, "utf8");
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();
