import { accountingHandler } from "../_shared/accounting-handler.ts";

Deno.serve(accountingHandler("approve"));
