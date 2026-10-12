import { handle } from "hono/vercel";
import app from "../server/app.js";

// On Vercel there is no always-on server: each /api/* request (see vercel.json)
// runs this serverless function, which hands the request over to the Hono app.
const handler = handle(app);

export const GET = handler;
export const POST = handler;
