import type {
  FsListRequest,
  FsListResponse,
  FsNodeDTO,
} from "@clintonprime/types";

// base config
const RAW_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const API_BASE = RAW_BASE.replace(/\/+$/, ""); // trim trailing slash

async function putToS3(putUrl: string, file: File) {
  const res = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`S3 PUT failed: ${res.status} ${text}`);
  }
}

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.code)) || res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data as T;
}

export const FsClient = {
  async list(args: FsListRequest = {}): Promise<FsListResponse> {
    const p = new URLSearchParams();
    if (args.parentId) p.set("parentId", args.parentId);
    if (args.skip != null) p.set("skip", String(args.skip));
    if (args.take != null) p.set("take", String(args.take));
    return http<FsListResponse>(`${API_BASE}/fs/list?${p.toString()}`);
  },

  async stat(id: string): Promise<{ node: FsNodeDTO }> {
    return http(`${API_BASE}/fs/node/${id}`);
  },

  async createFolder(name: string, parentId: string | null) {
    return http<{ node: FsNodeDTO }>(`${API_BASE}/fs/folder`, {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    });
  },

  async rename(id: string, name: string) {
    return http<{ node: FsNodeDTO }>(`${API_BASE}/fs/node/${id}/rename`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  async move(ids: string[], toParentId: string | null) {
    return http<{ moved: number }>(`${API_BASE}/fs/move`, {
      method: "POST",
      body: JSON.stringify({ ids, toParentId }),
    });
  },

  async remove(id: string) {
    return http<{ deleted: boolean }>(`${API_BASE}/fs/node/${id}`, {
      method: "DELETE",
    });
  },

  streamUrl(id: string) {
    return `${API_BASE}/fs/node/${id}/stream`;
  },
  async uploadInit(parentId: string | null, file: File) {
    const initRes = await fetch(`/api/fs/upload/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
        name: file.name,
        mime: file.type || "audio/mpeg",
        size: file.size,
      }),
    });
    if (!initRes.ok) throw new Error(await initRes.text());
    const { node, putUrl } = await initRes.json();
    await putToS3(putUrl, file);
    return node;
  },

  // optional fallback (multipart through API)
  async uploadMultipart(parentId: string | null, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const url = `/api/fs/upload?parentId=${encodeURIComponent(parentId ?? "")}`;
    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await res.text());
    const { node } = await res.json();
    return node;
  },
};
