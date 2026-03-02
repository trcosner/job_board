/**
 * Events module
 * 
 * Usage:
 * 
 * To emit events:
 *   import { emitUserRegistered } from '@/events/emitters';
 *   emitUserRegistered({ userId, email, ... });
 * 
 * Or use namespace:
 *   import { AuthEmitters } from '@/events/emitters';
 *   AuthEmitters.emitUserRegistered({ ... });
 * 
 * To subscribe to events (rare, mostly done in listeners):
 *   import { onUserRegistered } from '@/events/subscribers';
 *   onUserRegistered((data) => { ... });
 */

export * from './eventBus.js';
export * from './emitters/index.js';
export * from './subscribers/index.js';
