import { supabase } from "../config/supabaseClient.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { extractBearerToken } from "../utils/auth.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req.headers);

  if (!token) {
    throw new HttpError(401, "No autorizado. Token no proporcionado.");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new HttpError(401, "No autorizado. Token invalido.");
  }

  req.user = user;
  req.token = token;
  next();
});
