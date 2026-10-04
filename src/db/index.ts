import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Pooled connection string: the app opens many short-lived connections.
export const db = drizzle(process.env.DATABASE_URL!, { schema });
