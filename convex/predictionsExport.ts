"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import ExcelJS from "exceljs";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const EXPORT_FILENAME = "quinielas.xlsx";
/** Zona horaria para fechas en el Excel (Venezuela). */
const DISPLAY_TIMEZONE = "America/Caracas";
const HEADER_ROW = [
  "Grupo",
  "Fecha",
  "Local",
  "",
  "",
  "Visitante",
];

function sanitizeSheetName(baseName: string, usedNames: Set<string>) {
  const cleanedBase =
    baseName
      .replace(/[\\/*?:[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Participante";

  let candidate = cleanedBase.slice(0, 31);
  let suffix = 1;

  while (usedNames.has(candidate)) {
    const suffixText = ` (${suffix})`;
    candidate = `${cleanedBase.slice(0, Math.max(0, 31 - suffixText.length))}${suffixText}`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function formatMatchDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("es-MX", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatGeneratedAtLocal(now: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(now);
}

export const generatePredictionsExport = internalAction({
  args: {
    token: v.string(),
    groupId: v.id("groups"),
  },
  handler: async (ctx, { token, groupId }) => {
    try {
      const data = await ctx.runQuery(internal.predictions.getAllForExport, { groupId });
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "quiniela";
      workbook.created = new Date();
      workbook.modified = new Date();

      const usedSheetNames = new Set<string>(["Resumen"]);
      const predictionsByUser = new Map<string, Map<string, { homeScore: number; awayScore: number }>>();
      const bonusPredictionsByUser = new Map(
        data.bonusPredictions.map((prediction) => [prediction.userId, prediction])
      );

      for (const prediction of data.predictions) {
        const userPredictions =
          predictionsByUser.get(prediction.userId) ??
          new Map<string, { homeScore: number; awayScore: number }>();

        userPredictions.set(prediction.matchId, {
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
        });
        predictionsByUser.set(prediction.userId, userPredictions);
      }

      for (const user of data.users) {
        const worksheet = workbook.addWorksheet(
          sanitizeSheetName(user.displayName, usedSheetNames)
        );

        worksheet.columns = [
          { header: HEADER_ROW[0], key: "group", width: 10 },
          { header: HEADER_ROW[1], key: "date", width: 22 },
          { header: HEADER_ROW[2], key: "homeTeam", width: 22 },
          { header: HEADER_ROW[3], key: "homeScore", width: 8 },
          { header: HEADER_ROW[4], key: "awayScore", width: 8 },
          { header: HEADER_ROW[5], key: "awayTeam", width: 22 },
        ];

        worksheet.columns.forEach((column) => {
          column.alignment = {
            horizontal: "center",
            vertical: "middle",
          };
        });

        const userPredictions = predictionsByUser.get(user._id) ?? new Map();

        for (const match of data.matches) {
          const prediction = userPredictions.get(match._id);
          worksheet.addRow({
            group: match.group,
            date: formatMatchDate(match.date),
            homeTeam: match.homeTeam,
            homeScore: prediction?.homeScore ?? "",
            awayScore: prediction?.awayScore ?? "",
            awayTeam: match.awayTeam,
          });
        }

        const bonusPrediction = bonusPredictionsByUser.get(user._id);
        worksheet.addRow({});
        const sectionTitleRow = worksheet.addRow(["Predicciones especiales", "", "", "", "", ""]);
        worksheet.mergeCells(`A${sectionTitleRow.number}:F${sectionTitleRow.number}`);
        sectionTitleRow.font = { bold: true, size: 12 };
        sectionTitleRow.alignment = { horizontal: "left", vertical: "middle" };

        worksheet.addRow({
          group: "Goleador",
          date: bonusPrediction?.topScorerName ?? "",
          homeTeam: bonusPrediction?.topScorerTeamName ?? "",
          homeScore: "",
          awayScore: "",
          awayTeam: "",
        });
        worksheet.addRow({
          group: "Mas goles",
          date: bonusPrediction?.mostGoalsTeamName ?? "",
          homeTeam: "",
          homeScore: "",
          awayScore: "",
          awayTeam: "",
        });
        worksheet.addRow({
          group: "Menos recibidos",
          date: bonusPrediction?.leastConcededTeamName ?? "",
          homeTeam: "",
          homeScore: "",
          awayScore: "",
          awayTeam: "",
        });

        worksheet.insertRows(1, [
          [user.displayName, "", "", "", "", ""],
        ]);
        worksheet.mergeCells("A1:F1");
        worksheet.getCell("A1").font = { bold: true, size: 14 };
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(2).font = { bold: true };
        worksheet.getRow(2).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3C84B" },
        };
        worksheet.getRow(2).alignment = { horizontal: "center", vertical: "middle" };
        worksheet.views = [{ state: "frozen", ySplit: 2 }];
        worksheet.autoFilter = {
          from: "A2",
          to: "F2",
        };
      }

      const generatedAt = new Date();
      const summarySheet = workbook.addWorksheet("Resumen");
      summarySheet.columns = [
        { header: "Campo", key: "field", width: 28 },
        { header: "Valor", key: "value", width: 28 },
      ];
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.addRows([
        { field: "Archivo", value: EXPORT_FILENAME },
        {
          field: "Generado",
          value: `${formatGeneratedAtLocal(generatedAt)} (${DISPLAY_TIMEZONE})`,
        },
        { field: "Usuarios exportados", value: data.users.length },
        { field: "Predicciones registradas", value: data.predictions.length },
        { field: "Predicciones especiales", value: data.bonusPredictions.length },
        { field: "Partidos exportados", value: data.matches.length },
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const storageId = await ctx.storage.store(
        new Blob([buffer], {
          type: XLSX_MIME_TYPE,
        })
      );

      await ctx.runMutation(internal.tournamentSettings.completePredictionsExport, {
        token,
        groupId,
        storageId,
        filename: EXPORT_FILENAME,
        generatedAt: generatedAt.toISOString(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo generar quinielas.xlsx";

      await ctx.runMutation(internal.tournamentSettings.failPredictionsExport, {
        token,
        groupId,
        error: message,
      });
    }
  },
});
