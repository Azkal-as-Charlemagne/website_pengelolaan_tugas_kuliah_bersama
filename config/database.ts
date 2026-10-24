// File ini digunakan sebagai penghubung antara backend dan database.

import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

export function getDatabase(env: Env): D1Database {
  if (!env.DB) {
    throw new Error("Database belum dikonfigurasi");
  }

  return env.DB;
}
