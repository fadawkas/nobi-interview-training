import Agenda from "agenda";
import { env } from "../config/env.js";

let agenda = null;

/**
 * Initialize and return the singleton Agenda instance.
 * Call this once at server startup.
 */
export function getAgenda() {
  if (!agenda) {
    agenda = new Agenda({
      db: {
        address: env.mongoUri,
        collection: "agendaJobs",
      },
      defaultLockLifetime: 900000, // 15 min — covers long ASR/FEM/eval jobs
      processEvery: "5 seconds",
    });
  }
  return agenda;
}

/**
 * Start Agenda after job definitions are registered.
 */
export async function startAgenda() {
  const ag = getAgenda();
  await ag.start();
  console.log("Agenda job queue started.");
}

/**
 * Gracefully stop Agenda (call on SIGTERM/SIGINT).
 */
export async function stopAgenda() {
  if (agenda) {
    await agenda.stop();
    console.log("Agenda stopped.");
  }
}
