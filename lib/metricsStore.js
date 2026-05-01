// lib/metricsStore.js
// Simple in-memory store for prototype/testing on Vercel.
// NOTE: This is not durable; data is lost on redeploy / cold start.

const metricsStore = {
  events: [],
};

export function addEvent(event) {
  metricsStore.events.push(event);
}

export function getEvents() {
  return metricsStore.events;
}
