export const SOCKET_EVENTS = {
  TABLE_STATUS_CHANGED: 'table:status-changed',
  KOT_FIRED: 'kot:fired',
  KOT_ITEM_READY: 'kot:item-ready',
  KOT_BUMPED: 'kot:bumped',
  KOT_STATUS: 'kot:status',
  KOT_NEW: 'kot:new',
  INVENTORY_UPDATED: 'inventory:updated',
  ORDER_VOIDED: 'order:voided',
} as const;
