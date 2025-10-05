import axios from "axios";
import fs from "fs";
import { resolveEnvPath } from "../utils/env-path.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let refreshToken: string | null = process.env.SPOTIFY_REFRESH_TOKEN || null;
let accessToken: string | null = process.env.SPOTIFY_ACCESS_TOKEN || null;

const envPath: string = resolveEnvPath(process.cwd()) || "./.env";

function saveEnvVar(key: string, value: string) {
  try {
    let env = fs.readFileSync(envPath, "utf8");
    if (env.includes(`${key}=`)) {
      env = env.replace(new RegExp(`${key}=.*`, "g"), `${key}=${value}`);
    } else {
      env += `\n${key}=${value}`;
    }
    fs.writeFileSync(envPath, env);
    console.log(`Saved ${key} to .env`);
  } catch (err) {
    console.warn(`Could not persist ${key}:`, err);
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(tokens: {
  accessToken?: string;
  refreshToken?: string;
}) {
  if (tokens.accessToken) {
    accessToken = tokens.accessToken;
    saveEnvVar("SPOTIFY_ACCESS_TOKEN", accessToken);
  }
  if (tokens.refreshToken) {
    refreshToken = tokens.refreshToken;
    saveEnvVar("SPOTIFY_REFRESH_TOKEN", refreshToken);
  }
}

export async function refreshAccessTokenNow() {
  if (!CLIENT_ID || !CLIENT_SECRET || !refreshToken) {
    console.warn(
      "Spotify refresh prerequisites missing (client or refresh token)"
    );
    return;
  }
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const newAccess = response.data.access_token as string | undefined;
    const newRefresh = response.data.refresh_token as string | undefined;
    if (newAccess) {
      accessToken = newAccess;
      saveEnvVar("SPOTIFY_ACCESS_TOKEN", newAccess);
    }
    if (newRefresh) {
      refreshToken = newRefresh;
      saveEnvVar("SPOTIFY_REFRESH_TOKEN", newRefresh);
    }
    console.log("Spotify token refreshed:", new Date().toISOString());
  } catch (err: any) {
    console.error(
      "Spotify token refresh failed:",
      err.response?.data || err.message
    );
  }
}

// run immediately on startup (non-blocking)
void refreshAccessTokenNow();

// refresh every 50 minutes (token lasts 60)
setInterval(() => void refreshAccessTokenNow(), 50 * 60 * 1000);
