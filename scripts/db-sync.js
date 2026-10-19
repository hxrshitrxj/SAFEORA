const { execSync } = require("child_process");

console.log("🔄 [SAFEORA] Syncing Prisma schema with database...");

try {
  // Push database schema to PostgreSQL/cloud database without interactive prompt
  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    env: process.env,
  });
  console.log("✅ [SAFEORA] Database tables created / verified successfully.");
} catch (err) {
  console.warn(
    "⚠️ [SAFEORA] Database push skipped or database is not reachable at build time. Continuing build..."
  );
}
