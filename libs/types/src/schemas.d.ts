import { z } from "zod";
export declare const SpotifyTrackSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    artists: z.ZodArray<z.ZodString, "many">;
    album: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodNumber;
    previewUrl: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    artists: string[];
    durationMs: number;
    previewUrl: string | null;
    album?: string | undefined;
}, {
    id: string;
    name: string;
    artists: string[];
    durationMs: number;
    previewUrl: string | null;
    album?: string | undefined;
}>;
export type SpotifyTrack = z.infer<typeof SpotifyTrackSchema>;
export declare const NowPlayingSchema: z.ZodObject<{
    isPlaying: z.ZodBoolean;
    track: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        artists: z.ZodArray<z.ZodString, "many">;
        album: z.ZodOptional<z.ZodString>;
        durationMs: z.ZodNumber;
        previewUrl: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        artists: string[];
        durationMs: number;
        previewUrl: string | null;
        album?: string | undefined;
    }, {
        id: string;
        name: string;
        artists: string[];
        durationMs: number;
        previewUrl: string | null;
        album?: string | undefined;
    }>>;
    progressMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    isPlaying: boolean;
    track: {
        id: string;
        name: string;
        artists: string[];
        durationMs: number;
        previewUrl: string | null;
        album?: string | undefined;
    } | null;
    progressMs?: number | undefined;
}, {
    isPlaying: boolean;
    track: {
        id: string;
        name: string;
        artists: string[];
        durationMs: number;
        previewUrl: string | null;
        album?: string | undefined;
    } | null;
    progressMs?: number | undefined;
}>;
export type NowPlaying = z.infer<typeof NowPlayingSchema>;
export declare const MusicTrackSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    artist: z.ZodString;
    album: z.ZodString;
    duration: z.ZodNumber;
    hasCover: z.ZodBoolean;
    url: z.ZodString;
    cover: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    album: string;
    artist: string;
    duration: number;
    hasCover: boolean;
    url: string;
    cover: string;
}, {
    id: string;
    name: string;
    album: string;
    artist: string;
    duration: number;
    hasCover: boolean;
    url: string;
    cover: string;
}>;
export type MusicTrack = z.infer<typeof MusicTrackSchema>;
export declare const TracksResponseSchema: z.ZodObject<{
    tracks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        artist: z.ZodString;
        album: z.ZodString;
        duration: z.ZodNumber;
        hasCover: z.ZodBoolean;
        url: z.ZodString;
        cover: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        album: string;
        artist: string;
        duration: number;
        hasCover: boolean;
        url: string;
        cover: string;
    }, {
        id: string;
        name: string;
        album: string;
        artist: string;
        duration: number;
        hasCover: boolean;
        url: string;
        cover: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tracks: {
        id: string;
        name: string;
        album: string;
        artist: string;
        duration: number;
        hasCover: boolean;
        url: string;
        cover: string;
    }[];
}, {
    tracks: {
        id: string;
        name: string;
        album: string;
        artist: string;
        duration: number;
        hasCover: boolean;
        url: string;
        cover: string;
    }[];
}>;
export type TracksResponse = z.infer<typeof TracksResponseSchema>;
export declare const SpotifyNowSchema: z.ZodObject<{
    name: z.ZodString;
    artist: z.ZodString;
    albumArt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPlaying: z.ZodBoolean;
    url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isPlaying: boolean;
    artist: string;
    url?: string | null | undefined;
    albumArt?: string | null | undefined;
}, {
    name: string;
    isPlaying: boolean;
    artist: string;
    url?: string | null | undefined;
    albumArt?: string | null | undefined;
}>;
export type SpotifyNow = z.infer<typeof SpotifyNowSchema>;
export declare const RecentTrackSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    artist: z.ZodString;
    album: z.ZodString;
    image: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    url: z.ZodString;
    playedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    album: string;
    artist: string;
    url: string;
    playedAt: string;
    image?: string | null | undefined;
}, {
    id: string;
    name: string;
    album: string;
    artist: string;
    url: string;
    playedAt: string;
    image?: string | null | undefined;
}>;
export type RecentTrack = z.infer<typeof RecentTrackSchema>;
export declare const RecentTracksResponseSchema: z.ZodObject<{
    tracks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        artist: z.ZodString;
        album: z.ZodString;
        image: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        url: z.ZodString;
        playedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        album: string;
        artist: string;
        url: string;
        playedAt: string;
        image?: string | null | undefined;
    }, {
        id: string;
        name: string;
        album: string;
        artist: string;
        url: string;
        playedAt: string;
        image?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tracks: {
        id: string;
        name: string;
        album: string;
        artist: string;
        url: string;
        playedAt: string;
        image?: string | null | undefined;
    }[];
}, {
    tracks: {
        id: string;
        name: string;
        album: string;
        artist: string;
        url: string;
        playedAt: string;
        image?: string | null | undefined;
    }[];
}>;
export type RecentTracksResponse = z.infer<typeof RecentTracksResponseSchema>;
export declare const TEST: z.ZodObject<{
    name: z.ZodString;
    age: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    age: number;
}, {
    name: string;
    age: number;
}>;
