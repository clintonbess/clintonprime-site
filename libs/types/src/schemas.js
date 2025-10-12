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
export const NowPlayingSchema = z.object({
    isPlaying: z.boolean(),
    track: SpotifyTrackSchema.nullable(),
    progressMs: z.number().int().nonnegative().optional(),
});
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
export const TracksResponseSchema = z.object({
    tracks: z.array(MusicTrackSchema),
});
// Spotify "now playing" lightweight contract used by /spotify/current
export const SpotifyNowSchema = z.object({
    name: z.string(),
    artist: z.string(),
    albumArt: z.string().url().nullable().optional(),
    isPlaying: z.boolean(),
    url: z.string().url().nullable().optional(),
});
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
export const RecentTracksResponseSchema = z.object({
    tracks: z.array(RecentTrackSchema),
});
export const TEST = z.object({
    name: z.string(),
    age: z.number(),
});
