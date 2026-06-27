const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

export const verifyToken = async (idToken) => {
  const res = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Token verification failed");
  }

  return res.json();
};

export const getMyProfile = async (idToken) => {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to get profile");
  }

  return res.json();
};

// ---------------------------------------------------------------------------
// CHAT
// ---------------------------------------------------------------------------

export const sendMessage = async (message, idToken, language = "ur") => {
  const res = await fetch(`${BASE_URL}/api/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({ message, language }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Chat request failed");
  }

  return res.json();
};

export const sendMessagePublic = async (message, language = "ur") => {
  const res = await fetch(`${BASE_URL}/api/chat/message/public`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Chat request failed");
  }

  return res.json();
};

export const getChatHistory = async (idToken) => {
  const res = await fetch(`${BASE_URL}/api/chat/history`, {
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch history");
  }

  return res.json();
};

// ---------------------------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------------------------

export const pingBackend = async () => {
  try {
    const res = await fetch(`${BASE_URL}/`);
    return res.json();
  } catch {
    throw new Error("Cannot reach backend at " + BASE_URL);
  }
};