# Database Migrations

This directory contains database migration scripts for the Fixify application.

## Overview

Migrations help you:
- ✅ Update existing data to match new schema requirements
- ✅ Fix data inconsistencies (like string IDs vs ObjectIds)
- ✅ Track which changes have been applied to your database
- ✅ Safely rollback changes if needed
- ✅ Keep development, staging, and production databases in sync

## Available Commands

### Migration Commands

```bash
# Run all pending migrations
npm run migrate

# See what migrations would run (dry run)
npm run migrate:dry

# Check migration status
npm run migrate:status

# Rollback the last migration
npm run migrate:rollback
```

### Backup Commands

```bash
# Create a backup with timestamp
npm run backup

# Create a backup with custom name
npm run backup -- --name pre-migration-backup

# List available backups
npm run backup:list

# Restore from latest backup
npm run backup:restore -- latest

# Restore from specific backup
npm run backup:restore -- backup-name
```

## Current Migrations

### 001-fix-objectid-references.js

**Purpose**: Converts string IDs to proper ObjectIds in Review and Payment collections.

**What it fixes**:
- Review.reviewer (User reference)
- Review.reviewee (User reference) 
- Review.job (Job reference)
- Review.moderatedBy (User reference)
- Review.helpfulBy[] (User references)
- Review.flags[].user (User references)
- Payment.job (Job reference)
- Payment.client (User reference)
- Payment.helper (User reference)

**Why needed**: Ensures proper database relationships and enables efficient queries with population.

## Usage Workflow

### Before Running Migrations

1. **Create a backup** (recommended):
   ```bash
   npm run backup -- --name pre-migration-$(date +%Y%m%d)
   ```

2. **Check migration status**:
   ```bash
   npm run migrate:status
   ```

3. **Dry run** to see what would happen:
   ```bash
   npm run migrate:dry
   ```

### Running Migrations

1. **Run migrations**:
   ```bash
   npm run migrate
   ```

2. **Verify results** by checking your application works correctly

### If Something Goes Wrong

1. **Check what backups are available**:
   ```bash
   npm run backup:list
   ```

2. **Restore from backup**:
   ```bash
   npm run backup:restore -- backup-name
   ```

3. **Or rollback the last migration**:
   ```bash
   npm run migrate:rollback
   ```

## Migration File Structure

Each migration file should export:

```javascript
// Required: Main migration function
const runMigration = async () => {
  // Migration logic here
};

// Optional: Rollback function
const rollback = async () => {
  // Rollback logic here
};

module.exports = { runMigration, rollback };
```

## Creating New Migrations

1. **Create a new file** with format: `XXX-description.js` (e.g., `002-add-user-preferences.js`)

2. **Use the template**:
   ```javascript
   const mongoose = require('mongoose');
   const Model = require('../models/Model');

   const runMigration = async () => {
     console.log('🚀 Running migration: Add user preferences');
     
     // Your migration logic here
     
     console.log('✅ Migration completed');
   };

   const rollback = async () => {
     console.log('🔄 Rolling back: Add user preferences');
     
     // Your rollback logic here
     
     console.log('✅ Rollback completed');
   };

   module.exports = { runMigration, rollback };
   ```

3. **Test thoroughly**:
   - Run with `--dry-run` first
   - Test on a copy of production data
   - Verify rollback works if applicable

## Best Practices

### ✅ Do

- Always create a backup before running migrations in production
- Test migrations on a copy of production data first
- Use dry-run mode to preview changes
- Write rollback functions when possible
- Keep migrations idempotent (safe to run multiple times)
- Add logging to track migration progress

### ❌ Don't

- Run untested migrations on production data
- Skip backups for "simple" migrations
- Modify existing migration files after they've been applied
- Delete migration files that have been applied

## Troubleshooting

### Migration Fails

1. Check the error message in the console
2. Verify your database connection
3. Ensure you have sufficient permissions
4. Check if the migration has already been partially applied

### Backup/Restore Issues

1. Ensure `mongodump` and `mongorestore` are installed
2. Check MongoDB connection string in `.env`
3. Verify disk space for backups
4. Check file permissions in the `migrations/backups/` directory

### Performance Issues

- Large collections may take time to migrate
- Consider running migrations during low-traffic periods
- Monitor database performance during migration
- Use indexes to speed up queries in migrations

## Files in This Directory

- `migrate.js` - Migration runner script
- `backup.js` - Backup and restore utilities  
- `001-fix-objectid-references.js` - ObjectId reference fixes
- `backups/` - Directory for database backups (created automatically)
- `README.md` - This documentation

## Support

If you encounter issues with migrations:

1. Check this README for common solutions
2. Review the migration logs for specific error messages
3. Ensure your `.env` file has the correct `MONGODB_URI`
4. Test migrations on a development database first
