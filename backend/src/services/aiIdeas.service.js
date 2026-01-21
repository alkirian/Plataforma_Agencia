import { supabaseAdmin } from "../config/supabaseClient.js";
import { createAuthenticatedClient } from "../config/supabaseClient.js";

const openaiApiKey = process.env.OPENAI_API_KEY;

const pad2 = (n) => String(n).padStart(2, "0");
const weekdayToJs = (wd) => {
  // Input 1..7 (1=Lunes .. 7=Domingo) -> JS getDay() 0..6 (0=Domingo)
  if (wd === 7) return 0;
  return wd >= 1 && wd <= 6 ? wd : null; // 1..6 -> 1..6 (Lunes..Sábado)
};

const embedText = async (text) => {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!resp.ok) throw new Error("Error al generar embeddings");
  const json = await resp.json();
  return json.data?.[0]?.embedding || [];
};

const callLLM = async (prompt) => {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!resp.ok) throw new Error("Error al llamar al LLM");
  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content || "";
  return content;
};

const buildCandidateDates = ({
  startDate,
  count,
  preferWeekdays,
  allowedWeekdays,
  month,
  year,
}) => {
  const candidates = [];
  const now = new Date();
  const start = new Date(startDate);
  let current = new Date(start);

  // Conjunto de días permitidos (JS getDay: 0..6)
  let allowedSet = null;
  if (Array.isArray(allowedWeekdays) && allowedWeekdays.length) {
    allowedSet = new Set(
      allowedWeekdays.map(weekdayToJs).filter((x) => x !== null),
    );
  } else if (preferWeekdays) {
    allowedSet = new Set([1, 2, 3, 4, 5]); // L-V
  }

  const pushIfValid = (d) => {
    const jsDay = d.getDay();
    if (allowedSet && !allowedSet.has(jsDay)) return;
    if (month && year) {
      if (d.getMonth() + 1 !== month || d.getFullYear() !== year) return;
    }
    candidates.push(new Date(d));
  };

  // Hasta 90 días, suficiente para 2-3 meses vista
  const limitDays = 90;
  for (let i = 0; i < limitDays && candidates.length < count * 4; i++) {
    const d = new Date(current);
    d.setDate(current.getDate() + i);
    // Evitar días pasados si el target es el mes actual
    if (
      d < now &&
      (!month ||
        !year ||
        (month === now.getMonth() + 1 && year === now.getFullYear()))
    )
      continue;
    pushIfValid(d);
  }
  return candidates;
};

const distributeDates = ({ candidates, count }) => {
  if (!candidates.length) return [];
  const step = Math.ceil(candidates.length / count);
  const out = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.min(i * step, candidates.length - 1);
    out.push(candidates[idx]);
  }
  return out;
};

import crypto from "crypto";

export const generateScheduleIdeas = async ({
  clientId,
  userPrompt = "",
  monthContext = [],
  tone = "Profesional",
  count = 10,
  preferWeekdays = true,
  allowedWeekdays = null,
  month = null,
  year = null,
  platforms = [],
  token,
  userId = null,
}) => {
  // Validar acceso al cliente vía RLS
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: client, error: clientErr } = await supabaseAuth
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", clientId)
    .single();
  if (clientErr) throw new Error(clientErr.message);

  // Fallback de desarrollo si no hay OpenAI
  if (!openaiApiKey) {
    const now = new Date();
    const startDate = new Date(now);
    if (month && year) {
      startDate.setFullYear(year);
      startDate.setMonth(month - 1, 1);
    }
    const cnd = buildCandidateDates({
      startDate,
      count,
      preferWeekdays,
      allowedWeekdays,
      month,
      year,
    });
    const picks = distributeDates({ candidates: cnd, count });
    const fallbackIdeas = Array.from(
      { length: Math.max(1, Number(count) || 10) },
      (_, i) => {
        const d =
          picks[i] ||
          new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1);
        const y = d.getFullYear();
        const m = pad2(d.getMonth() + 1);
        const day = pad2(d.getDate());
        return {
          title: `${tone} · Idea ${i + 1} (${client.name})`,
          copy: `Propuesta ${i + 1} para ${client.name}. Ajusta el copy según la voz de marca.`,
          hashtags: ["#marketing", `#${client.name.replace(/\s+/g, "")}`],
          call_to_action: "¿Te gustó? Comenta y comparte.",
          visualProposal: {
            type: "carousel",
            description: "Carrusel de 5 diapositivas con tips clave.",
            specs: {
              format: "4:5",
              elements: ["Tips clave", "Información visual", "Call to action"],
            },
          },
          platforms,
          scheduled_at: `${y}-${m}-${day}`,
          status: "Pendiente",
          tone,
        };
      },
    );
    return fallbackIdeas;
  }

  // Embedding de la consulta (usar prompt genérico si está vacío). Si falla, seguimos sin RAG.
  const baseQuery = userPrompt?.trim()
    ? userPrompt.trim()
    : `Genera ideas de calendario de contenido mensual para ${client.name}`;
  let queryEmbedding = null;
  try {
    queryEmbedding = await embedText(baseQuery);
  } catch (e) {
    // No embeddings -> sin RAG
    queryEmbedding = null;
  }

  // Buscar chunks relevantes usando la función search_context_chunks (si embeddings disponibles).
  let matches = [];
  if (
    queryEmbedding &&
    Array.isArray(queryEmbedding) &&
    queryEmbedding.length
  ) {
    try {
      const { data, error } = await supabaseAdmin.rpc("search_context_chunks", {
        query_embedding: queryEmbedding,
        match_client_id: clientId,
        match_count: 8,
        match_threshold: 0.78,
      });
      if (!error) {
        matches = data || [];
      } else {
        // Si falla la RPC (función no existe o error), continuamos sin contexto
        matches = [];
      }
    } catch (_e) {
      matches = [];
    }
  }

  // Crear contexto enriquecido con información de las fuentes
  const topContext = (matches || [])
    .map(
      (m) =>
        `${m.document_source_type?.toUpperCase() || "CONTEXT"} ${m.document_name}: ${m.content}`,
    )
    .join("\n---\n");

  const calendarCtx = Array.isArray(monthContext)
    ? monthContext.join(", ")
    : "";

  // Fechas objetivo
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  const targetMonthName = new Date(
    targetYear,
    targetMonth - 1,
    1,
  ).toLocaleString("es-ES", { month: "long", year: "numeric" });
  const nextTargetDate = new Date(targetYear, targetMonth, 1);
  const nextTargetMonthName = nextTargetDate.toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const toneInstruction = `Tono: ${tone}. Mantén consistencia con la marca del cliente.`;
  const daysInstruction = (() => {
    if (Array.isArray(allowedWeekdays) && allowedWeekdays.length) {
      return `Usa preferentemente estos días de publicación (1=Lunes..7=Domingo): [${allowedWeekdays.join(", ")}].`;
    }
    if (preferWeekdays) return "Prefiere días hábiles (lunes a viernes).";
    return "Distribuye fechas a lo largo del mes de forma equilibrada.";
  })();
  const countSafe = Math.max(1, Math.min(15, Number(count) || 10));

  // Si no hay prompt del usuario, generamos instrucciones para contenido basado en la marca
  const taskDescription = userPrompt?.trim()
    ? `enfocadas en: "${userPrompt.trim()}"`
    : `que reflejen la esencia de la marca, sus valores, productos/servicios, y audiencia objetivo. Usa el CONTEXTO DEL CLIENTE para inspirarte y crear contenido relevante y auténtico`;

  const megaPrompt = `Eres estratega de contenidos senior para redes sociales especializado en crear contenido auténtico y alineado con la identidad de marca.

CONTEXTO TEMPORAL:
- Fecha actual: ${now.toLocaleDateString("es-ES")}
- Mes objetivo: ${targetMonthName}
- Próximo periodo: ${nextTargetMonthName}
- Genera ideas principalmente para ${targetMonthName} y si faltan días, completa al inicio de ${nextTargetMonthName}

CONTEXTO DEL CLIENTE ${client.name}:
${topContext || "Información del cliente no disponible. Genera ideas genéricas profesionales."}

FECHAS IMPORTANTES: ${calendarCtx || "No hay fechas especiales registradas"}

TAREA: Genera ${countSafe} ideas de posteos creativos para el cliente ${client.name}, ${taskDescription}.

IMPORTANTE: ${!userPrompt?.trim() ? "Como NO se proporcionó un tema específico, DEBES analizar profundamente el CONTEXTO DEL CLIENTE y crear ideas que:" : ""}
${!userPrompt?.trim() ? "- Reflejen la personalidad y valores de la marca" : ""}
${!userPrompt?.trim() ? "- Destaquen productos, servicios o expertise mencionados" : ""}
${!userPrompt?.trim() ? "- Conecten con la audiencia objetivo identificada" : ""}
${!userPrompt?.trim() ? "- Aprovechen las fechas importantes si las hay" : ""}
${!userPrompt?.trim() ? "- Sean variadas: promocionales, educativas, inspiracionales, behind-the-scenes, testimonios, etc." : ""}

INSTRUCCIONES ESPECÍFICAS:
1. Cada idea debe incluir: title, copy, hashtags (3 a 6 relevantes), call_to_action, media (type, description), platforms (si aplica) y scheduled_at.
2. scheduled_at en formato YYYY-MM-DD, distribuido en ${targetMonthName}; si no hay suficientes días, usar inicios de ${nextTargetMonthName}. ${daysInstruction}
3. ${toneInstruction}
4. El copy en español, claro y accionable; máximo ~180 palabras. Evita clichés y generalidades.
5. media.type concreto y creativo (ej: carrusel 5 slides, reel 30s, ilustración, influencer hablando, tutorial, behind-the-scenes, antes/después, infografía) con description breve y accionable.
6. hashtags: mezcla hashtags de marca (basados en el nombre del cliente) con hashtags temáticos relevantes; 3–6 total.
7. platforms: sugiere según el formato y audiencia (IG para visual lifestyle, TikTok para videos cortos virales, LinkedIn para B2B profesional, YouTube para contenido largo).
8. Sé ESPECÍFICO y CONTEXTUAL. Usa detalles del CONTEXTO DEL CLIENTE en el copy (menciona productos, servicios, valores, o características únicas).

FORMATO DE RESPUESTA: Entrega SOLO un JSON válido: un array con objetos de la forma:
{
  "title": string,
  "copy": string,
  "hashtags": string[],
  "call_to_action": string,
  "media": { "type": string, "description": string },
  "platforms": string[],
  "scheduled_at": "YYYY-MM-DD"
}`;

  const llmResponse = await callLLM(megaPrompt);

  // Intentar parsear JSON
  let ideas;
  try {
    ideas = JSON.parse(llmResponse);
  } catch (_e) {
    const jsonStart = llmResponse.indexOf("[");
    const jsonEnd = llmResponse.lastIndexOf("]");
    if (jsonStart >= 0 && jsonEnd >= 0) {
      ideas = JSON.parse(llmResponse.slice(jsonStart, jsonEnd + 1));
    } else {
      throw new Error("La respuesta del modelo no es JSON válido");
    }
  }

  // Post-procesado de seguridad y fechas
  const startDate = new Date(
    year || now.getFullYear(),
    month ? month - 1 : now.getMonth(),
    1,
  );
  const cnd = buildCandidateDates({
    startDate,
    count: countSafe,
    preferWeekdays,
    allowedWeekdays,
    month: month || now.getMonth() + 1,
    year: year || now.getFullYear(),
  });
  const picks = distributeDates({ candidates: cnd, count: countSafe });

  const safeIdeas = (Array.isArray(ideas) ? ideas : [])
    .slice(0, countSafe)
    .map((raw, i) => {
      const d = (() => {
        if (typeof raw?.scheduled_at === "string") {
          const tryD = new Date(raw.scheduled_at);
          if (!isNaN(tryD.getTime())) return tryD;
        }
        return picks[i] || startDate;
      })();
      const y = d.getFullYear();
      const m = pad2(d.getMonth() + 1);
      const day = pad2(d.getDate());

      // Parse media type to extract duration and format
      const mediaType = String(raw?.media?.type || "carrusel");
      const mediaDescription = String(raw?.media?.description || "");

      // Map media type to visual proposal type
      let visualType = "image";
      let duration = undefined;
      let format = "1:1";

      if (mediaType.includes("carrusel") || mediaType.includes("carousel")) {
        visualType = "carousel";
        format = "4:5";
      } else if (mediaType.includes("reel") || mediaType.includes("reels")) {
        visualType = "reels";
        format = "9:16";
        duration = mediaType.match(/\d+s/)?.[0] || "30s";
      } else if (
        mediaType.includes("video") &&
        mediaType.includes("influencer")
      ) {
        visualType = "video-influencer";
        format = "16:9";
        duration = "1m";
      } else if (mediaType.includes("video")) {
        visualType = "video";
        format = "16:9";
        duration = "1m";
      } else if (
        mediaType.includes("cobertura") ||
        mediaType.includes("coverage")
      ) {
        visualType = "coverage";
        format = "9:16";
      } else if (
        mediaType.includes("animación") ||
        mediaType.includes("animation") ||
        mediaType.includes("motion")
      ) {
        visualType = "animation";
        format = "1:1";
        duration = "15s";
      } else if (mediaType.includes("tutorial")) {
        visualType = "video";
        format = "16:9";
        duration = "2m";
      } else if (mediaType.includes("behind")) {
        visualType = "coverage";
        format = "9:16";
      }

      return {
        title: String(raw?.title || `Idea ${i + 1}`),
        copy: String(raw?.copy || ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.slice(0, 8) : [],
        call_to_action: String(raw?.call_to_action || ""),
        visualProposal: {
          type: visualType,
          description: mediaDescription,
          specs: {
            duration,
            format,
            elements: mediaDescription
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean)
              .slice(0, 3),
          },
        },
        platforms:
          Array.isArray(raw?.platforms) && raw.platforms.length
            ? raw.platforms.map((p) => String(p).toLowerCase())
            : platforms,
        scheduled_at: `${y}-${m}-${day}`,
        status: "Pendiente",
        tone,
      };
    });

  // Try to persist into ai_ideas table (best-effort). If table missing, just return the ideas.
  const sessionId = crypto.randomUUID();
  try {
    const records = safeIdeas.map((idea, idx) => ({
      client_id: clientId,
      agency_id: client?.agency_id || null,
      session_id: sessionId,
      seq: idx,
      tone,
      prompt: userPrompt || null,
      title: idea.title,
      copy: idea.copy,
      hashtags: idea.hashtags,
      cta: idea.call_to_action || null,
      media_type: idea.visualProposal?.type || null,
      media_description: idea.visualProposal?.description || null,
      platforms: idea.platforms || null,
      suggested_date: idea.scheduled_at,
      status: "generated",
      created_by: userId,
    }));

    const { data: inserted, error } = await createAuthenticatedClient(token)
      .from("ai_ideas")
      .insert(records)
      .select("id, seq");

    if (error) {
      console.error("Error al guardar ideas en DB:", error);
      // Aún así devolver las ideas generadas, pero sin IDs persistidos
      return safeIdeas.map((idea) => ({ ...idea, session_id: sessionId }));
    }

    if (Array.isArray(inserted)) {
      // Map ids back by seq
      const idBySeq = new Map(inserted.map((r) => [r.seq, r.id]));
      return safeIdeas.map((idea, idx) => ({
        ...idea,
        id: idBySeq.get(idx),
        session_id: sessionId,
      }));
    }
  } catch (err) {
    console.error("Error inesperado al persistir ideas:", err);
  }
  return safeIdeas;
};

export const upsertIdeaFeedback = async ({
  clientId,
  ideaId,
  userId,
  token,
  value,
}) => {
  const supabaseAuth = createAuthenticatedClient(token);
  // Verify idea belongs to client
  const { data: idea, error: ideaErr } = await supabaseAuth
    .from("ai_ideas")
    .select("id, client_id")
    .eq("id", ideaId)
    .single();
  if (ideaErr) throw new Error("Idea no encontrada");
  if (idea.client_id !== clientId)
    throw new Error("Idea no pertenece al cliente");

  if (value === "clear") {
    await supabaseAuth
      .from("ai_idea_feedback")
      .delete()
      .eq("idea_id", ideaId)
      .eq("user_id", userId);
  } else {
    const v = value === "like" ? 1 : value === "dislike" ? -1 : null;
    if (v === null) throw new Error("Valor de feedback inválido");
    // Upsert: delete then insert to keep unique constraint simple
    await supabaseAuth
      .from("ai_idea_feedback")
      .delete()
      .eq("idea_id", ideaId)
      .eq("user_id", userId);
    await supabaseAuth
      .from("ai_idea_feedback")
      .insert({ idea_id: ideaId, user_id: userId, value: v });
  }

  // Recompute aggregates
  const { data: aggRows } = await supabaseAuth
    .from("ai_idea_feedback")
    .select("value")
    .eq("idea_id", ideaId);
  const likeCount = (aggRows || []).filter((r) => r.value === 1).length;
  const dislikeCount = (aggRows || []).filter((r) => r.value === -1).length;

  await supabaseAuth
    .from("ai_ideas")
    .update({ like_count: likeCount, dislike_count: dislikeCount })
    .eq("id", ideaId);

  return {
    idea_id: ideaId,
    like_count: likeCount,
    dislike_count: dislikeCount,
  };
};

export const listIdeas = async ({
  clientId,
  month = null,
  year = null,
  sessionId = null,
  token,
}) => {
  const supabaseAuth = createAuthenticatedClient(token);
  let q = supabaseAuth
    .from("ai_ideas")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (sessionId) q = q.eq("session_id", sessionId);
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    q = q
      .gte("suggested_date", start.toISOString().slice(0, 10))
      .lt("suggested_date", end.toISOString().slice(0, 10));
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  // Map to frontend shape
  return (data || []).map((r) => ({
    id: r.id,
    title: r.title,
    copy: r.copy,
    hashtags: r.hashtags || [],
    call_to_action: r.cta || "",
    visualProposal: {
      type: r.media_type || "image",
      description: r.media_description || "",
      specs: {
        format: "1:1",
        elements: [],
      },
    },
    platforms: r.platforms || [],
    scheduled_at: r.suggested_date || null,
    status: "Pendiente",
    tone: r.tone || null,
    session_id: r.session_id,
    like_count: r.like_count,
    dislike_count: r.dislike_count,
  }));
};
