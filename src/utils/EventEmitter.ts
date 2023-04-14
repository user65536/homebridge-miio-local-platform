import Event from 'events';

type GenericEvents = Record<string, (...args: any) => any>;
export type ListenerType<Events extends GenericEvents> = <T extends keyof Events>(event: T, listener: Events[T]) => void;
export type EmitterType<Events extends GenericEvents> = <T extends keyof Events>(event: T, ...args: Parameters<Events[T]>) => void;

export class EventEmitter<Events extends GenericEvents> {
  event = new Event();
  on: ListenerType<Events> = (event: any, listener: any) => {
    this.event.on(event, listener);
  };

  off: ListenerType<Events> = (event: any, listener: any) => {
    this.event.on(event, listener);
  };

  emit: EmitterType<Events> = (event: any, ...args: any) => {
    this.event.emit(event, ...args);
  };
}
