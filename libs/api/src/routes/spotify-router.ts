import express, { Request, Response, NextFunction } from "express";
import querystring from "querystring";
import SpotifyWebApi from "spotify-web-api-node";
import axios from "axios";
import { resolveEnvPath } from "../utils/env-path.js";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  refreshAccessTokenNow,
} from "../services/spotify-refresh.js";

const router = express.Router();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
});

// refresh token flow
spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN!);
router.get("/login", (_req, res) => {
  var scope = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-recently-played",
  ];
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        scope: scope.join(","),
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      })
  );
});

router.get("/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string | null;
  const state = req.query.state as string | null;

  if (!code || state === null) {
    return res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  }

  try {
    // build the POST body
    const form = querystring.stringify({
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      grant_type: "authorization_code",
    });

    // build the headers for basic auth
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    };

    // exchange the code for tokens
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      form,
      { headers }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    if (refresh_token || access_token) {
      setTokens({ accessToken: access_token, refreshToken: refresh_token });
      if (refresh_token) spotifyApi.setRefreshToken(refresh_token);
      if (access_token) spotifyApi.setAccessToken(access_token);
    }

    // You can either respond with JSON or redirect back to your app
    res.json({
      access_token,
      refresh_token,
      expires_in,
    });

    // Optionally store refresh_token securely (DB, env, etc.)
  } catch (err: any) {
    console.error("Spotify auth error:", err.response?.data || err.message);

    res.status(400).json({
      error: "invalid_client_or_code",
      details: err.response?.data || err.message,
    });
  }
});

// Ensure we always have tokens available for downstream routes
router.use(ensureSpotifyAuth);

router.get("/current", async (_req, res) => {
  try {
    const playback = await spotifyApi.getMyCurrentPlaybackState();
    const track = playback.body.item;

    if (!track) {
      const recent = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 1 });
      const last = recent.body.items[0].track;
      return res.json({
        name: last.name,
        artist: last.artists.map((a: any) => a.name).join(", "),
        albumArt: last.album.images[0].url,
        isPlaying: false,
      });
    }

    // Handle both music tracks and podcast episodes
    if ("artists" in track) {
      return res.json({
        name: (track as any).name,
        artist: (track as any).artists.map((a: any) => a.name).join(", "),
        albumArt: (track as any).album?.images?.[0]?.url,
        isPlaying: playback.body.is_playing,
        url: (track as any).external_urls?.spotify,
      });
    } else {
      // EpisodeObject
      const episode: any = track as any;
      return res.json({
        name: episode.name,
        artist: episode.show?.name ?? "Podcast",
        albumArt: episode.images?.[0]?.url ?? episode.show?.images?.[0]?.url,
        isPlaying: playback.body.is_playing,
        url: episode.external_urls?.spotify,
      });
    }
  } catch (err) {
    console.error("Spotify error:", err);
    res.status(500).json({ error: "Failed to fetch track" });
  }
});

router.get("/recent", async (_req, res) => {
  try {
    // Fetch last 5 recently played tracks
    const recent = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 5 });

    const tracks = recent.body.items.map((item) => {
      const track = item.track;
      return {
        id: track.id,
        name: track.name,
        artist:
          (track as any).artists?.map((a: any) => a.name).join(", ") ??
          (track as any).show?.name ??
          "",
        album: (track as any).album?.name ?? (track as any).show?.name ?? "",
        image:
          (track as any).album?.images?.[0]?.url ??
          (track as any).images?.[0]?.url ??
          (track as any).show?.images?.[0]?.url,
        url: track.external_urls.spotify,
        playedAt: item.played_at,
      };
    });

    res.json({ tracks });
  } catch (err: any) {
    console.error("Spotify recent error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recent tracks" });
  }
});

export default router;
import fs from "fs";

const envPath = resolveEnvPath(process.cwd()) || "./.env";

async function ensureSpotifyAuth(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return res.status(400).json({
        error:
          "No refresh token available. Please authorize via /api/spotify/login.",
      });
    }

    // Always set the latest refresh token on the client
    spotifyApi.setRefreshToken(refreshToken);

    let accessToken = getAccessToken();
    if (!accessToken) {
      await refreshAccessTokenNow();
      accessToken = getAccessToken();
      if (!accessToken) {
        return res
          .status(500)
          .json({ error: "Failed to refresh access token" });
      }
    }
    spotifyApi.setAccessToken(accessToken);

    return next();
  } catch (err: any) {
    console.error(
      "ensureSpotifyAuth error:",
      err.response?.data || err.message
    );
    return res.status(500).json({
      error: "Failed to ensure Spotify auth",
      details: err.response?.data || err.message,
    });
  }
}

// Removed local env read/write helpers in favor of spotify-refresh service
