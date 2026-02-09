export type SyncPayload = {
  data: Record<string, unknown>;
  deletions?: Record<string, string[]>;
};

export async function syncLogin(username: string, password: string) {
  const res = await fetch("/api/sync/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as { token: string; userId: string; username: string };
}

export async function syncPull(token: string) {
  const res = await fetch("/api/sync/pull", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as { data: any };
}

export async function syncPush(token: string, payload: SyncPayload) {
  const res = await fetch("/api/sync/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as { ok: boolean };
}
