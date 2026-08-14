module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/helpers/loadEnv.ts"],
  testTimeout: 15000,
  // ts-jest owns jest.mock() hoisting for .ts. Nothing under tests/ is
  // JavaScript any more, so babel-jest is no longer in the chain.
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },
  // dist/ now holds a second copy of every module. Without these, jest registers
  // both and a test can end up importing the compiled build instead of the source.
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/generated/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"]
};
