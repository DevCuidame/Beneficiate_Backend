// src/modules/websocket/websocket-events.js
// This module acts as an event bus for WebSocket events

/**
 * Event handlers registry
 * Structure: { eventName: [handlers] }
 */
const eventHandlers = new Map();

/**
 * Register a handler for a specific event
 * @param {string} eventName - Name of the event
 * @param {Function} handler - Function to handle the event
 */
const on = (eventName, handler) => {
  if (!eventHandlers.has(eventName)) {
    eventHandlers.set(eventName, []);
  }
  eventHandlers.get(eventName).push(handler);
};

/**
 * Emit an event to all registered handlers
 * @param {string} eventName - Name of the event
 * @param {*} data - Event data
 */
const emit = (eventName, data) => {
  const handlers = eventHandlers.get(eventName);
  if (handlers && handlers.length > 0) {
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in handler for event '${eventName}':`, error);
      }
    });
  }
};

// Export the event bus functionality
module.exports = {
  on,
  emit
};