import { v4 as uuid } from "uuid";
import type { NeoEventBus } from "./types";

export function createEventBus(): NeoEventBus {
  const handlers = new Map<string, Set<Function>>();

  function on(topic: string, handler: Function) {
    const set = handlers.get(topic) || new Set();
    set.add(handler);
    handlers.set(topic, set);
    return () => set.delete(handler);
  }

  function emit(topic: string, payload?: any) {
    handlers.get(topic)?.forEach((h) => h(payload));
  }

  async function ask<TReq = any, TRes = any>(
    topic: string,
    payload?: TReq,
    timeoutMs = 15000
  ): Promise<TRes> {
    const cid = uuid();
    const reply = `${topic}:reply:${cid}`;
    return new Promise<TRes>((resolve, reject) => {
      const off = on(reply, (data: any) => {
        off();
        resolve(data as TRes);
      });
      setTimeout(() => {
        off();
        reject(new Error(`ask timeout: ${topic}`));
      }, timeoutMs);
      emit(topic, { ...(payload as any), __cid: cid, __reply: reply });
    });
  }

  return { on, emit, ask };
}
