/**
 * reportGenerator.ts
 * Generates official MDRRMO Balayan, Batangas incident report soft copies
 * in Microsoft Word (.docx) format.
 *
 * Formats exactly match the real MDRRMO soft copies:
 *
 * DAILY   — One "INCIDENT REPORT" narrative page per incident.
 *           "That on or about [TIME] of [DATE], a [TYPE] occurred at [LOCATION].
 *            That the patient... MDRRMO responders arrived... transported to [HOSPITAL]."
 *           + Prepared by / Checked by / Noted by block
 *
 * WEEKLY  — One "WEEKLY INCIDENT REPORT" per calendar week.
 *           Narrative paragraph summarising incident counts per type.
 *           + Prepared by / Checked by / Noted by block
 *
 * MONTHLY — Single "MONTHLY INCIDENT REPORT".
 *           Narrative paragraph summarising the full month.
 *           + Prepared by / Checked by / Noted by block
 */

import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, PageOrientation, convertInchesToTwip,
  UnderlineType,
} from "docx";
import { saveAs } from "file-saver";
import type { Incident } from "../types";

// ─── staff names (from real soft copies) ─────────────────────────────────────
const PREPARED_BY  = "Rosalinda Espinar";
const PREPARED_ROLE = "Incident Documentation Staff";
const CHECKED_BY   = "Giovanni Marco";
const CHECKED_ROLE = "Operations-In-Charge";
const NOTED_BY     = "Christian Noel Villanueva";
const NOTED_ROLE   = "MGDH I / L DRRMO";

// ─── helpers ─────────────────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, "0"); }

function militaryTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}H`;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function dateStr(d: Date): string {
  return d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

function monthName(d: Date): string {
  return d.toLocaleDateString("en-PH", { month: "long" }).toUpperCase();
}

/** Convert a number to English words for small values (used in the narrative) */
function toWords(n: number): string {
  const ones = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
                 "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
                 "Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n % 10 ? `-${ones[n%10]}` : "");
  return String(n);
}

/** "Seventeen (17)" */
function wordNum(n: number): string { return `${toWords(n)} (${n})`; }

// ─── shared text styles ───────────────────────────────────────────────────────

const FONT = "Times New Roman";
const BODY_SIZE = 22;   // 11pt in half-points
const TITLE_SIZE = 28;  // 14pt

function bold(text: string, size = BODY_SIZE): TextRun {
  return new TextRun({ text, bold: true, size, font: FONT });
}

function normal(text: string, size = BODY_SIZE): TextRun {
  return new TextRun({ text, size, font: FONT });
}

function underlined(text: string, size = BODY_SIZE): TextRun {
  return new TextRun({ text, bold: true, size, font: FONT, underline: { type: UnderlineType.SINGLE } });
}

const INDENT = "            "; // paragraph indent (tab-like leading spaces)

// ─── signature block (identical across all three formats) ────────────────────

function signatureBlock(): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 240, after: 40 },
      children: [
        normal("Prepared by:      "),
        normal("Checked by:       "),
        normal("Noted by:"),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        underlined(`${PREPARED_BY}      `),
        underlined(`${CHECKED_BY}      `),
        underlined(NOTED_BY),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        normal(`${PREPARED_ROLE}      `),
        normal(`${CHECKED_ROLE}      `),
        normal(NOTED_ROLE),
      ],
    }),
  ];
}

// ─── PAGE BREAK paragraph ─────────────────────────────────────────────────────

function pageBreak(): Paragraph {
  return new Paragraph({ pageBreakBefore: true, children: [] });
}

// ─── TITLE paragraph ──────────────────────────────────────────────────────────

function reportTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: TITLE_SIZE,
        font: FONT,
        underline: { type: UnderlineType.SINGLE },
      }),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY REPORT
// Format: one INCIDENT REPORT narrative per incident
// ─────────────────────────────────────────────────────────────────────────────

function buildDailyIncidentPage(inc: Incident, isFirst: boolean): Paragraph[] {
  const time     = militaryTime(inc.createdAt);
  const date     = longDate(inc.createdAt);
  const type     = inc.aiDetectedType || "Medical Emergency";
  const location = inc.latitude && inc.longitude
    ? `near coordinates ${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}, Balayan, Batangas`
    : "Balayan, Batangas";
  const reporter = inc.reporter?.name || "Unknown Reporter";
  const phone    = inc.reporter?.phoneNumber ? ` (${inc.reporter.phoneNumber})` : "";
  const status   = inc.status;
  const dept     = inc.assignedDepartment || inc.aiRecommendedDept || "MDRRMO";
  const notes    = inc.adminNotes || "";

  // Determine action taken based on status
  const actionText = status === "RESOLVED"
    ? "The patient was immediately transported to the hospital for further evaluation and treatment."
    : status === "REJECTED"
    ? "The response was considered stood down / cancelled."
    : status === "DISPATCHED"
    ? `${dept} emergency responders are currently responding to the scene.`
    : "The incident is currently under assessment by MDRRMO personnel.";

  const paragraphs: Paragraph[] = [];

  // Page break before every incident except the first
  if (!isFirst) paragraphs.push(pageBreak());

  paragraphs.push(reportTitle("INCIDENT REPORT"));

  // Main narrative paragraph 1 — incident overview
  paragraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 160 },
      alignment: AlignmentType.BOTH,
      children: [
        normal(`${INDENT}That on or about ${time} of ${date}, a `),
        bold(type),
        normal(` occurred at ${location}.`),
      ],
    })
  );

  // Paragraph 2 — reporter / caller info
  paragraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 160 },
      alignment: AlignmentType.BOTH,
      children: [
        normal(`${INDENT}That the incident was reported by `),
        bold(reporter),
        normal(`${phone}. ${notes ? notes + " " : ""}${actionText}`),
      ],
    })
  );

  // Paragraph 3 — MDRRMO response
  paragraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 160 },
      alignment: AlignmentType.BOTH,
      children: [
        normal(`${INDENT}That the Municipal Disaster Risk Reduction and Management Office (`),
        bold("MDRRMO"),
        normal(") emergency responders immediately responded to the scene to assess the situation and provide proper care management in accordance with standard operating procedures."),
      ],
    })
  );

  paragraphs.push(...signatureBlock());

  return paragraphs;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY REPORT
// Format: one WEEKLY INCIDENT REPORT per calendar week
// ─────────────────────────────────────────────────────────────────────────────

/** Group incidents by ISO week (Mon–Sun) */
function groupByWeek(incidents: Incident[]): Map<string, Incident[]> {
  const map = new Map<string, Incident[]>();
  for (const inc of incidents) {
    const d    = new Date(inc.createdAt);
    const day  = d.getDay(); // 0=Sun
    const mon  = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = isoDate(mon);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(inc);
  }
  return map;
}

function ordinalWeek(weekIndex: number): string {
  const words = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];
  return words[weekIndex] ?? `Week ${weekIndex + 1}`;
}

function buildWeeklyPage(
  weekIncidents: Incident[],
  weekIndex: number,
  fromDate: Date,
  toDate: Date,
  isFirst: boolean,
): Paragraph[] {
  const total     = weekIncidents.length;
  const trauma    = weekIncidents.filter(i => i.aiDetectedType?.toLowerCase().includes("trauma") || i.aiDetectedType?.toLowerCase().includes("accident")).length;
  const medical   = weekIncidents.filter(i => i.aiDetectedType?.toLowerCase().includes("medical") || i.aiDetectedType?.toLowerCase().includes("conduction")).length;
  const fire      = weekIncidents.filter(i => i.aiDetectedType?.toLowerCase().includes("fire")).length;
  const crime     = weekIncidents.filter(i => i.aiDetectedType?.toLowerCase().includes("crime")).length;
  const other     = total - trauma - medical - fire - crime;

  const fromLabel = fromDate.toLocaleDateString("en-PH", { month: "long", day: "numeric" }).toUpperCase();
  const toLabel   = toDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const ord       = ordinalWeek(weekIndex);

  const paragraphs: Paragraph[] = [];
  if (!isFirst) paragraphs.push(pageBreak());

  paragraphs.push(reportTitle("WEEKLY INCIDENT REPORT"));

  // Opening sentence
  paragraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 160 },
      alignment: AlignmentType.BOTH,
      children: [
        normal(`${INDENT}For the `),
        bold(`${ord} week of the Month`),
        normal(` Dated: `),
        bold(`${fromLabel}-${toLabel}`),
        normal(`. The Municipal Disaster Risk Reduction and Management Office (`),
        bold("MDRRMO"),
        normal(`) emergency responders responded to `),
        bold(wordNum(total)),
        normal(" incident" + (total !== 1 ? "s." : ".")),
      ],
    })
  );

  // Trauma breakdown
  if (trauma > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [
          normal(`${INDENT}That `),
          bold(wordNum(trauma)),
          normal(` of the incident${total !== 1 ? "s" : ""} were `),
          bold("Trauma / Vehicular Accident Emergencies"),
          normal(", wherein patients obtained various injuries including abrasions, laceration wounds, contusions, and fractures. All conscious patients were given proper care management and immediately transported to the hospital for further evaluation and treatment."),
        ],
      })
    );
  }

  // Medical breakdown
  if (medical > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [
          normal(`${INDENT}That `),
          bold(wordNum(medical)),
          normal(` of the incident${total !== 1 ? "s" : ""} were `),
          bold("Medical Emergencies"),
          normal(", involving conditions such as dizziness, hypertension, difficulty of breathing, body weakness, and other related medical conditions. Patients were assessed, given proper care, and transported to the hospital for further treatment."),
        ],
      })
    );
  }

  // Fire
  if (fire > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [
          normal(`${INDENT}That `),
          bold(wordNum(fire)),
          normal(` of the incident${total !== 1 ? "s" : ""} were `),
          bold("Fire Incidents"),
          normal(", to which MDRRMO emergency responders immediately responded in coordination with the Bureau of Fire Protection."),
        ],
      })
    );
  }

  // Crime
  if (crime > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [
          normal(`${INDENT}That `),
          bold(wordNum(crime)),
          normal(` of the incident${total !== 1 ? "s" : ""} were `),
          bold("Crime-Related Incidents"),
          normal(", in which MDRRMO provided emergency medical assistance to affected individuals in coordination with law enforcement."),
        ],
      })
    );
  }

  // Other
  if (other > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [
          normal(`${INDENT}That `),
          bold(wordNum(other)),
          normal(` of the incident${total !== 1 ? "s" : ""} were other types of emergencies responded to by MDRRMO personnel.`),
        ],
      })
    );
  }

  // Closing sentence
  paragraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 160 },
      alignment: AlignmentType.BOTH,
      children: [
        normal(`${INDENT}That the four (4) teams of the Municipal Disaster and Risk Reduction and Management Office (`),
        bold("MDRRMO"),
        normal("), emergency responders, radio operators, and the operation sections diligently and effectively did their duties."),
      ],
    })
  );

  paragraphs.push(...signatureBlock());
  return paragraphs;
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY REPORT
// Format: single MONTHLY INCIDENT REPORT narrative
// ─────────────────────────────────────────────────────────────────────────────

function buildMonthlyPage(incidents: Incident[], month: Date): Paragraph[] {
  const total    = incidents.length;
  const trauma   = incidents.filter(i => i.aiDetectedType?.toLowerCase().includes("trauma") || i.aiDetectedType?.toLowerCase().includes("accident")).length;
  const medical  = incidents.filter(i => i.aiDetectedType?.toLowerCase().includes("medical") || i.aiDetectedType?.toLowerCase().includes("conduction")).length;
  const fire     = incidents.filter(i => i.aiDetectedType?.toLowerCase().includes("fire")).length;
  const crime    = incidents.filter(i => i.aiDetectedType?.toLowerCase().includes("crime")).length;
  const other    = total - trauma - medical - fire - crime;
  const resolved = incidents.filter(i => i.status === "RESOLVED").length;

  const paragraphs: Paragraph[] = [];
  paragraphs.push(reportTitle("MONTHLY INCIDENT REPORT"));

  // Opening
  paragraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 160 },
      alignment: AlignmentType.BOTH,
      children: [
        normal(`${INDENT}For the month of `),
        bold(monthName(month)),
        normal(` ${month.getFullYear()}, the Municipal Disaster Risk Reduction and Management Office (`),
        bold("MDRRMO"),
        normal(") emergency responders handled a total of "),
        bold(wordNum(total)),
        normal(" incident" + (total !== 1 ? "s." : ".")),
      ],
    })
  );

  // Type breakdown
  const typeParts: TextRun[] = [];
  if (trauma > 0)  { typeParts.push(bold(wordNum(trauma))); typeParts.push(normal(" Trauma / Vehicular Accident Emergencies")); }
  if (medical > 0) { if (typeParts.length) typeParts.push(normal(", ")); typeParts.push(bold(wordNum(medical))); typeParts.push(normal(" Medical Emergencies")); }
  if (fire > 0)    { if (typeParts.length) typeParts.push(normal(", ")); typeParts.push(bold(wordNum(fire)));    typeParts.push(normal(" Fire Incidents")); }
  if (crime > 0)   { if (typeParts.length) typeParts.push(normal(", ")); typeParts.push(bold(wordNum(crime)));   typeParts.push(normal(" Crime-Related Incidents")); }
  if (other > 0)   { if (typeParts.length) typeParts.push(normal(", ")); typeParts.push(bold(wordNum(other)));   typeParts.push(normal(" Other Incidents")); }

  if (typeParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [normal(`${INDENT}These included `), ...typeParts, normal(".")],
      })
    );
  }

  // Trauma narrative
  if (trauma > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [
          normal(`${INDENT}Most trauma cases involved vehicular accidents and falls resulting in abrasions, lacerations, contusions, swelling, body pain, and possible fractures. Patients were given immediate care management and transported to hospitals for further evaluation and treatment.`),
        ],
      })
    );
  }

  // Medical narrative
  if (medical > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        alignment: AlignmentType.BOTH,
        children: [
          normal(`${INDENT}Medical emergencies commonly involved dizziness, hypertension, asthma attacks, difficulty of breathing, loss of consciousness, vomiting, body weakness, and other related conditions.`),
        ],
      })
    );
  }

  // Resolution summary
  paragraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 160 },
      alignment: AlignmentType.BOTH,
      children: [
        normal(`${INDENT}Of the total incidents, `),
        bold(wordNum(resolved)),
        normal(` were fully resolved. Throughout the month, the four (4) teams of the `),
        bold("MDRRMO"),
        normal(" emergency responders, radio operators, and operations personnel diligently and effectively performed their duties in responding to all reported incidents."),
      ],
    })
  );

  paragraphs.push(...signatureBlock());
  return paragraphs;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

async function buildDoc(children: Paragraph[]): Promise<Blob> {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY_SIZE } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.PORTRAIT },
          margin: {
            top:    convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left:   convertInchesToTwip(1.25),
            right:  convertInchesToTwip(1.25),
          },
        },
      },
      children,
    }],
  });
  return await Packer.toBlob(doc);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE RANGE HELPERS (used by Analytics.tsx)
// ─────────────────────────────────────────────────────────────────────────────

export function getDailyRange() {
  const now  = new Date();
  const from = isoDate(now);
  return {
    from,
    to: from,
    label: `DAILY-INCIDENT-REPORT_${from}.docx`,
    period: `Date: ${dateStr(now)}`,
  };
}

export function getWeeklyRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const from = isoDate(mon);
  const to   = isoDate(now);
  return {
    from,
    to,
    label: `WEEKLY-INCIDENT-REPORT_${mon.toLocaleDateString("en-PH",{month:"long",year:"numeric"}).replace(/ /g,"-").toUpperCase()}.docx`,
    period: `Week of ${dateStr(mon)} – ${dateStr(now)}`,
  };
}

export function getMonthlyRange() {
  const now   = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: isoDate(first),
    to:   isoDate(now),
    label: `MONTHLY-INCIDENT-REPORT_${now.toLocaleDateString("en-PH",{month:"long",year:"numeric"}).replace(/ /g,"-").toUpperCase()}.docx`,
    period: `Month of ${now.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC DOWNLOAD FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadDailyReport(incidents: Incident[]) {
  const children: Paragraph[] = [];
  if (incidents.length === 0) {
    children.push(reportTitle("INCIDENT REPORT"));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [normal("No incidents recorded for today.")],
    }));
    children.push(...signatureBlock());
  } else {
    incidents.forEach((inc, i) => {
      children.push(...buildDailyIncidentPage(inc, i === 0));
    });
  }
  const { label } = getDailyRange();
  const blob = await buildDoc(children);
  saveAs(blob, label);
}

export async function downloadWeeklyReport(incidents: Incident[]) {
  const weekMap   = groupByWeek(incidents);
  const children: Paragraph[] = [];

  if (incidents.length === 0) {
    children.push(reportTitle("WEEKLY INCIDENT REPORT"));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [normal("No incidents recorded for this week.")],
    }));
    children.push(...signatureBlock());
  } else {
    const sortedKeys = Array.from(weekMap.keys()).sort();
    sortedKeys.forEach((weekStart, idx) => {
      const weekIncs  = weekMap.get(weekStart)!;
      const fromDate  = new Date(weekStart + "T00:00:00");
      // to = last incident date in that week, or Sun
      const lastInc   = weekIncs[weekIncs.length - 1];
      const toDate    = new Date(lastInc.createdAt);
      children.push(...buildWeeklyPage(weekIncs, idx, fromDate, toDate, idx === 0));
    });
  }

  const { label } = getWeeklyRange();
  const blob = await buildDoc(children);
  saveAs(blob, label);
}

export async function downloadMonthlyReport(incidents: Incident[]) {
  const children: Paragraph[] = [];
  const month = new Date();

  if (incidents.length === 0) {
    children.push(reportTitle("MONTHLY INCIDENT REPORT"));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [normal("No incidents recorded for this month.")],
    }));
    children.push(...signatureBlock());
  } else {
    children.push(...buildMonthlyPage(incidents, month));
  }

  const { label } = getMonthlyRange();
  const blob = await buildDoc(children);
  saveAs(blob, label);
}
