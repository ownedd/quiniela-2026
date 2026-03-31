import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return new Response("No autenticado", { status: 401 });
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return new Response("No se pudo validar la sesión con Convex", { status: 401 });
  }

  const exportData = await fetchQuery(api.tournamentSettings.getPredictionsExport, {}, { token });

  if (!exportData) {
    return new Response("La exportación no está disponible", { status: 404 });
  }

  if (exportData.status !== "ready" || !exportData.url) {
    return new Response("La exportación todavía no está lista", { status: 409 });
  }

  const fileResponse = await fetch(exportData.url, {
    cache: "no-store",
  });

  if (!fileResponse.ok) {
    return new Response("No se pudo descargar el archivo desde Convex Storage", {
      status: 502,
    });
  }

  return new Response(fileResponse.body, {
    status: 200,
    headers: {
      "Content-Type": XLSX_MIME_TYPE,
      "Content-Disposition": `attachment; filename="${exportData.filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
