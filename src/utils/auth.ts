
export function isTokenValid(): boolean {
  const token = localStorage.getItem("access_token");
  const expiryStr = localStorage.getItem("token_expiry");

  if (!token || !expiryStr) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_expiry");
    return false;
  }

  const expiry = Number(expiryStr);
  if (isNaN(expiry) || Date.now() >= expiry) {
    // Token expired or invalid expiry value
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_expiry");
    return false;
  }

  return true;
}