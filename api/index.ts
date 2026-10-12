import { handle } from "hono/vercel";
import app from "../server/app.js";

// Sur Vercel, pas de serveur allumé en permanence : chaque requête /api/* (voir vercel.json)
// exécute cette fonction serverless, qui transmet la requête à l'application Hono.
const handler = handle(app);

export const GET = handler;
export const POST = handler;
