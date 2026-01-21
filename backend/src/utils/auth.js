/**
 * Helpers relacionados con autenticacion HTTP
 */

export const getAuthorizationHeader = (headers) => {
  if (!headers) return null;
  return headers.authorization || headers.Authorization || null;
};

export const extractBearerToken = (headers) => {
  const header = getAuthorizationHeader(headers);
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;

  return token.trim();
};
