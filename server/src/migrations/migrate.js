/**
 * Migration Runner
 * Runs all pending migrations
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🔄 Migration Runner\n');
  console.log('=' .repeat(50) + '\n');

  const migrationsDir = __dirname;
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => {
      // Only include files that match migration pattern (number-*.js)
      // Exclude utility files like wait-for-ready.js
      return file.endsWith('.js') && 
             file !== 'migrate.js' && 
             file !== 'wait-for-ready.js' &&
             /^\d+-/.test(file); // Must start with number-
    })
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migrations found.');
    return;
  }

  console.log(`Found ${migrationFiles.length} migration(s):\n`);

  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    console.log(`📦 Running: ${file}`);
    console.log('-'.repeat(50));

    try {
      const migration = require(migrationPath);
      if (typeof migration.runMigration === 'function') {
        await migration.runMigration();
      } else {
        console.log(`⚠️  Migration ${file} doesn't export runMigration function`);
      }
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error.message);
      throw error;
    }

    console.log('\n');
  }

  console.log('=' .repeat(50));
  console.log('✅ All migrations completed!\n');
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
