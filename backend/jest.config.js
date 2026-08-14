module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/helpers/loadEnv.js"],
  testTimeout: 15000,
  // Both entries are required. Declaring `transform` at all replaces jest's
  // default, and dropping babel-jest from it means .js files stop being
  // transformed -- which silently disables jest.mock() hoisting, so mocks apply
  // after the module under test has already been required.
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
    "^.+\\.jsx?$": "babel-jest"
  },
  // dist/ now holds a second copy of every module. Without these, jest registers
  // both and a test can end up importing the compiled build instead of the source.
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/generated/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"]
};
