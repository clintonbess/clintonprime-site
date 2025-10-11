import { z } from "zod";

// Shared data contracts between web and api

export const SpotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(z.string()),
  album: z.string().optional(),
  durationMs: z.number().int().nonnegative(),
  previewUrl: z.string().url().nullable(),
});

export type SpotifyTrack = z.infer<typeof SpotifyTrackSchema>;

export const NowPlayingSchema = z.object({
  isPlaying: z.boolean(),
  track: SpotifyTrackSchema.nullable(),
  progressMs: z.number().int().nonnegative().optional(),
});

export type NowPlaying = z.infer<typeof NowPlayingSchema>;

// Music library contracts
export const MusicTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  album: z.string(),
  duration: z.number().nonnegative(),
  hasCover: z.boolean(),
  url: z.string(),
  cover: z.string(),
});

export type MusicTrack = z.infer<typeof MusicTrackSchema>;

export const TracksResponseSchema = z.object({
  tracks: z.array(MusicTrackSchema),
});

export type TracksResponse = z.infer<typeof TracksResponseSchema>;

// Spotify "now playing" lightweight contract used by /spotify/current
export const SpotifyNowSchema = z.object({
  name: z.string(),
  artist: z.string(),
  albumArt: z.string().url().nullable().optional(),
  isPlaying: z.boolean(),
  url: z.string().url().nullable().optional(),
});

export type SpotifyNow = z.infer<typeof SpotifyNowSchema>;

// Spotify "recent" tracks contract used by /spotify/recent
export const RecentTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  album: z.string(),
  image: z.string().url().nullable().optional(),
  url: z.string().url(),
  playedAt: z.string(),
});

export type RecentTrack = z.infer<typeof RecentTrackSchema>;

export const RecentTracksResponseSchema = z.object({
  tracks: z.array(RecentTrackSchema),
});

export type RecentTracksResponse = z.infer<typeof RecentTracksResponseSchema>;

export const TEST = z.object({
  name: z.string(),
  age: z.number(),
});
