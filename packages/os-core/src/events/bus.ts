export type OSEvent =
  | { type: "os.open"; path: string }
  | { type: "os.download"; path: string }
  | { type: "log.append"; path: string; text: string };

type Handler<T extends OSEvent> = (e: T) => void;

export class EventBus {
  private map = new Map<string, Set<Function>>();

  emit(e: OSEvent) {
    const set = this.map.get(e.type);
    if (!set) return;
    for (const fn of set) {
      (fn as Handler<OSEvent>)(e);
    }
  }

  on<T extends OSEvent["type"]>(
    type: T,
    handler: (e: Extract<OSEvent, { type: T }>) => void
  ): () => void {
    if (!this.map.has(type)) this.map.set(type, new Set());
    const set = this.map.get(type)!;
    set.add(handler as any);
    return () => set.delete(handler as any);
  }

  clear() {
    this.map.clear();
  }
}
