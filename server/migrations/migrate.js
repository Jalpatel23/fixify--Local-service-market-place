/**
 * Migration Runner
 * 
 * Runs database migrations in order and tracks which ones have been applied.
 * 
 * Usage:
 *   node migrations/migrate.js                    # Run all pending migrations
 *   node migrations/migrate.js --dry-run          # Show what would be migrated
 *   node migrations/migrate.js --rollback        # Rollback last migration
 *   node migrations/migrate.js --status          # Show migration status
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify';

// Migration tracking schema
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now },
  version: { type: String, required: true }
});

const Migration = mongoose.model('Migration', migrationSchema);

/**
 * Get list of available migration files
 */
const getAvailableMigrations = () => {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.match(/^\d{3}-.*\.js$/) && file !== 'migrate.js')
    .sort();
  
  return files.map(file => ({
    name: file.replace('.js', ''),
    file: path.join(migrationsDir, file)
  }));
};

/**
 * Get list of applied migrations from database
 */
const getAppliedMigrations = async () => {
  try {
    const applied = await Migration.find({}).sort({ appliedAt: 1 });
    return applied.map(m => m.name);
  } catch (error) {
    // If migrations collection doesn't exist yet, return empty array
    return [];
  }
};

/**
 * Get pending migrations
 */
const getPendingMigrations = async () => {
  const available = getAvailableMigrations();
  const applied = await getAppliedMigrations();
  
  return available.filter(migration => !applied.includes(migration.name));
};

/**
 * Run a single migration
 */
const runMigration = async (migration, dryRun = false) => {
  console.log(`📦 ${dryRun ? '[DRY RUN] ' : ''}Running migration: ${migration.name}`);
  
  if (dryRun) {
    console.log(`   Would execute: ${migration.file}`);
    return;
  }
  
  try {
    // Import and run the migration
    const migrationModule = require(migration.file);
    
    if (typeof migrationModule.runMigration === 'function') {
      await migrationModule.runMigration();
    } else {
      console.log(`⚠️  Migration ${migration.name} does not export runMigration function`);
      return;
    }
    
    // Record that this migration was applied
    await Migration.create({
      name: migration.name,
      version: '1.0.0',
      appliedAt: new Date()
    });
    
    console.log(`✅ Migration ${migration.name} completed successfully`);
    
  } catch (error) {
    console.error(`❌ Migration ${migration.name} failed:`, error);
    throw error;
  }
};

/**
 * Rollback the last migration
 */
const rollbackLastMigration = async (dryRun = false) => {
  const applied = await Migration.find({}).sort({ appliedAt: -1 }).limit(1);
  
  if (applied.length === 0) {
    console.log('ℹ️  No migrations to rollback');
    return;
  }
  
  const lastMigration = applied[0];
  console.log(`🔄 ${dryRun ? '[DRY RUN] ' : ''}Rolling back migration: ${lastMigration.name}`);
  
  if (dryRun) {
    console.log(`   Would rollback: ${lastMigration.name}`);
    return;
  }
  
  try {
    // Try to find and run rollback function
    const migrationFile = path.join(__dirname, `${lastMigration.name}.js`);
    
    if (fs.existsSync(migrationFile)) {
      const migrationModule = require(migrationFile);
      
      if (typeof migrationModule.rollback === 'function') {
        await migrationModule.rollback();
        console.log(`✅ Rollback function executed for ${lastMigration.name}`);
      } else {
        console.log(`⚠️  No rollback function found for ${lastMigration.name}`);
      }
    }
    
    // Remove migration record
    await Migration.deleteOne({ _id: lastMigration._id });
    console.log(`✅ Migration ${lastMigration.name} rolled back successfully`);
    
  } catch (error) {
    console.error(`❌ Rollback failed for ${lastMigration.name}:`, error);
    throw error;
  }
};

/**
 * Show migration status
 */
const showStatus = async () => {
  const available = getAvailableMigrations();
  const applied = await getAppliedMigrations();
  const pending = await getPendingMigrations();
  
  console.log('\n📊 Migration Status:');
  console.log('==================');
  
  if (available.length === 0) {
    console.log('ℹ️  No migration files found');
    return;
  }
  
  console.log(`📦 Available migrations: ${available.length}`);
  console.log(`✅ Applied migrations: ${applied.length}`);
  console.log(`⏳ Pending migrations: ${pending.length}`);
  
  if (applied.length > 0) {
    console.log('\n✅ Applied:');
    for (const name of applied) {
      console.log(`   ${name}`);
    }
  }
  
  if (pending.length > 0) {
    console.log('\n⏳ Pending:');
    for (const migration of pending) {
      console.log(`   ${migration.name}`);
    }
  }
  
  console.log('');
};

/**
 * Main function
 */
const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rollback = args.includes('--rollback');
  const status = args.includes('--status');
  
  try {
    console.log('🚀 Migration Runner');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    if (status) {
      await showStatus();
      return;
    }
    
    if (rollback) {
      await rollbackLastMigration(dryRun);
      return;
    }
    
    // Run pending migrations
    const pending = await getPendingMigrations();
    
    if (pending.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }
    
    console.log(`📦 Found ${pending.length} pending migration(s)`);
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN - No changes will be made:');
    }
    
    for (const migration of pending) {
      await runMigration(migration, dryRun);
    }
    
    if (!dryRun) {
      console.log(`\n🎉 Successfully applied ${pending.length} migration(s)`);
    }
    
  } catch (error) {
    console.error('💥 Migration runner error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  rollbackLastMigration,
  showStatus,
  getPendingMigrations,
  getAppliedMigrations
};
