// src/lib/bus.ts
type Handler<T> = (msg: T) => void;

export class Bus<T> {
  private handlers = new Set<Handler<T>>();
  on(h: Handler<T>) { this.handlers.add(h); return () => this.handlers.delete(h); }
  emit(msg: T) { this.handlers.forEach(h => h(msg)); }
}
