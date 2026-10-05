import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Tests that exercise the default (non-injected) db share a single
    // on-disk SQLite file. libSQL/SQLite WAL access across concurrent worker
    // processes can expose partially-checkpointed reads, making file-backed
    // tests flaky. Run the suite in a single fork so file access is
    // serialized; isolated in-memory tests are unaffected and still fast.
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
