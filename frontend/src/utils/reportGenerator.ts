/**
 * reportGenerator.ts
 * Generates official MDRRMO Balayan, Batangas incident report soft copies
 * in Microsoft Word (.docx) format, matching the standard LGU report layout.
 *
 * Layout follows: Municipality header → incident log table →
 * summary totals → signature block
 */

import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle,
  TableLayoutType, ShadingType,
  VerticalAlign, PageOrientation, convertInchesToTwip,
} from "docx";
import { saveAs } from "file-saver";
import type { Incident } from "../types";
import { getNearestBarangay } from "../data/balayan-data";

// ─── colour constants ─────────────────────────────────────────────────────────
const NAVY   = "1E3A5F";
const BLUE   = "2563EB";
const LGRAY  = "F1F5F9";
const WHITE  = "FFFFFF";
const BORDER_COLOR = "CBD5E1";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function dateStr(d: Date) {
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

const thin = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: BORDER_COLOR,
};



// ─── header paragraphs (Republic, Province, Municipality) ────────────────────

function makeHeader(title: string, period: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "Republic of the Philippines",
          size: 18,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "Province of Batangas",
          size: 18,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "Municipality of Balayan",
          size: 20,
          bold: true,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE",
          size: 22,
          bold: true,
          color: NAVY,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "─────────────────────────────────────────────────────",
          size: 18,
          color: BORDER_COLOR,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: title,
          size: 28,
          bold: true,
          color: NAVY,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: period,
          size: 22,
          italics: true,
          color: BLUE,
          font: "Arial",
        }),
      ],
    }),
  ];
}

// ─── incident log table ───────────────────────────────────────────────────────

const COL_HEADERS = [
  "No.", "Date", "Time", "Incident Type", "Barangay / Location",
  "Reporter", "Contact No.", "Status", "Dept Assigned", "Admin Notes",
];

const COL_WIDTHS_PCT = [4, 10, 7, 13, 16, 12, 11, 8, 10, 9];

function headerRow(): TableRow {
  return new TableRow({
    tableHeader: true,
    children: COL_HEADERS.map((h, i) =>
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: NAVY, color: NAVY },
        width: { size: COL_WIDTHS_PCT[i], type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        borders: { top: thin, bottom: thin, left: thin, right: thin },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: h,
                bold: true,
                size: 16,
                color: WHITE,
                font: "Arial",
              }),
            ],
          }),
        ],
      })
    ),
  });
}

function dataRow(inc: Incident, idx: number): TableRow {
  const even = idx % 2 === 0;
  const fill = even ? WHITE : LGRAY;

  const location = inc.latitude && inc.longitude
    ? getNearestBarangay(inc.latitude, inc.longitude)
    : "—";

  const cells = [
    String(idx + 1),
    fmtDate(inc.createdAt),
    fmtTime(inc.createdAt),
    inc.aiDetectedType || "Unknown",
    location,
    inc.reporter?.name || "—",
    inc.reporter?.phoneNumber || "—",
    inc.status,
    inc.assignedDepartment || inc.aiRecommendedDept || "—",
    inc.adminNotes || "—",
  ];

  return new TableRow({
    children: cells.map((val, i) =>
      new TableCell({
        shading: { type: ShadingType.SOLID, fill, color: fill },
        width: { size: COL_WIDTHS_PCT[i], type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        borders: { top: thin, bottom: thin, left: thin, right: thin },
        children: [
          new Paragraph({
            alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: [
              new TextRun({
                text: val,
                size: 16,
                font: "Arial",
              }),
            ],
          }),
        ],
      })
    ),
  });
}

function makeTable(incidents: Incident[]): Table {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow(), ...incidents.map((inc, i) => dataRow(inc, i))],
  });
}

// ─── summary block ────────────────────────────────────────────────────────────

function makeSummary(incidents: Incident[]): Paragraph[] {
  const total      = incidents.length;
  const pending    = incidents.filter(i => i.status === "PENDING").length;
  const reviewing  = incidents.filter(i => i.status === "REVIEWING").length;
  const dispatched = incidents.filter(i => i.status === "DISPATCHED").length;
  const resolved   = incidents.filter(i => i.status === "RESOLVED").length;
  const rejected   = incidents.filter(i => i.status === "REJECTED").length;

  const typeCounts: Record<string, number> = {};
  incidents.forEach(inc => {
    const t = inc.aiDetectedType || "Unknown";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeBreakdown = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t}: ${n}`)
    .join("  |  ");

  const row = (label: string, val: string | number) =>
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 20, font: "Arial", color: NAVY }),
        new TextRun({ text: String(val), size: 20, font: "Arial" }),
      ],
    });

  return [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: "INCIDENT SUMMARY",
          bold: true,
          size: 24,
          color: NAVY,
          font: "Arial",
          underline: {},
        }),
      ],
    }),
    row("Total Incidents", total),
    row("Pending Review", pending),
    row("Under Review", reviewing),
    row("Dispatched", dispatched),
    row("Resolved", resolved),
    row("Rejected", rejected),
    row("Type Breakdown", typeBreakdown || "N/A"),
    new Paragraph({
      spacing: { before: 80, after: 0 },
      children: [new TextRun({ text: " " })],
    }),
  ];
}

// ─── signature block ──────────────────────────────────────────────────────────

function makeSigBlock(prepared: string): Paragraph[] {
  const today = dateStr(new Date());

  const sigLine = (role: string, name: string) => [
    new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun({ text: " " })] }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${role}: `,
          bold: true, size: 20, font: "Arial", color: NAVY,
        }),
        new TextRun({
          text: "_________________________________",
          size: 20, font: "Arial",
        }),
        new TextRun({
          text: "     Date: ________________",
          size: 20, font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `          ${name}`,
          italics: true, size: 18, font: "Arial", color: "475569",
        }),
      ],
    }),
  ];

  return [
    new Paragraph({
      spacing: { before: 280, after: 80 },
      children: [
        new TextRun({
          text: "CERTIFICATION",
          bold: true, size: 24, color: NAVY, font: "Arial", underline: {},
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `This report was prepared on ${today} based on live data recorded in the MDRRMO Balayan Incident Monitoring System.`,
          size: 18, font: "Arial", italics: true, color: "475569",
        }),
      ],
    }),
    ...sigLine("Prepared by", prepared),
    ...sigLine("Verified by", "MDRRMO Personnel"),
    ...sigLine("Approved by", "Municipal DRRM Officer"),
  ];
}

// ─── document builder ─────────────────────────────────────────────────────────

async function buildDoc(
  title: string,
  period: string,
  incidents: Incident[],
  preparedBy: string,
): Promise<Blob> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: {
              top:    convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left:   convertInchesToTwip(0.75),
              right:  convertInchesToTwip(0.75),
            },
          },
        },
        children: [
          ...makeHeader(title, period),
          incidents.length > 0
            ? makeTable(incidents)
            : new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
                children: [
                  new TextRun({
                    text: "No incidents recorded for this period.",
                    italics: true,
                    size: 20,
                    color: "94A3B8",
                    font: "Arial",
                  }),
                ],
              }),
          ...makeSummary(incidents),
          ...makeSigBlock(preparedBy),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// ─── date range helpers ───────────────────────────────────────────────────────

export function getDailyRange(): { from: string; to: string; label: string; period: string } {
  const now = new Date();
  const from = isoDate(now);
  return {
    from,
    to: from,
    label: `MDRRMO_Daily_Report_${from}.docx`,
    period: `Date: ${dateStr(now)}`,
  };
}

export function getWeeklyRange(): { from: string; to: string; label: string; period: string } {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun
  const mon  = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const from = isoDate(mon);
  const to   = isoDate(now);
  return {
    from,
    to,
    label: `MDRRMO_Weekly_Report_${from}_to_${to}.docx`,
    period: `Week of ${dateStr(mon)} – ${dateStr(now)}`,
  };
}

export function getMonthlyRange(): { from: string; to: string; label: string; period: string } {
  const now   = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const from  = isoDate(first);
  const to    = isoDate(now);
  return {
    from,
    to,
    label: `MDRRMO_Monthly_Report_${now.toLocaleDateString("en-PH", { month: "long" })}_${now.getFullYear()}.docx`,
    period: `Month of ${now.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`,
  };
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function downloadDailyReport(incidents: Incident[]) {
  const { label, period } = getDailyRange();
  const blob = await buildDoc("DAILY INCIDENT REPORT", period, incidents, "On-Duty Dispatcher");
  saveAs(blob, label);
}

export async function downloadWeeklyReport(incidents: Incident[]) {
  const { label, period } = getWeeklyRange();
  const blob = await buildDoc("WEEKLY INCIDENT REPORT", period, incidents, "On-Duty Dispatcher");
  saveAs(blob, label);
}

export async function downloadMonthlyReport(incidents: Incident[]) {
  const { label, period } = getMonthlyRange();
  const blob = await buildDoc("MONTHLY INCIDENT REPORT", period, incidents, "On-Duty Dispatcher");
  saveAs(blob, label);
}
