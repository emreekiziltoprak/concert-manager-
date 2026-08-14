import path from "path";
import dotenv from "dotenv";

// Silences dotenv's startup banner for every config() call in the process,
// including the ones inside prismaClient and stripeClient, so test output stays
// pristine without modifying production files.
process.env.DOTENV_CONFIG_QUIET = "true";

dotenv.config({
  path: path.resolve(__dirname, "../../.env.test"),
  override: true
});
