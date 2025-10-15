export interface NeoFS {
    audio: {
        fromLocalFile(file: File): Promise<import("../file/neo-file.js").NeoFileDescriptor>;
    };
}
