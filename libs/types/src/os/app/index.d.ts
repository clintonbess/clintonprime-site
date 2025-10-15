export interface NeoAppManifest {
    id: string;
    name: string;
    entry: () => Promise<{
        mount(ctx: import("../kernel/index.js").NeoContext): void;
        unmount?: () => void;
    }>;
}
