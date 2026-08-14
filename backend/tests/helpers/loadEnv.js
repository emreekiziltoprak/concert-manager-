const path = require("path");

// Silences dotenv's startup banner for every config() call in the process,
// including the ones inside prismaClient.js and stripeClient.js, so test
// output stays pristine without modifying production files.
process.env.DOTENV_CONFIG_QUIET = "true";

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env.test"),
  override: true
});
