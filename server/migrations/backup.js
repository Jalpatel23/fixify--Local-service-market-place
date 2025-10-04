/**
 * Database Backup Script
 * 
 * Creates a backup of the database before running migrations.
 * 
 * Usage:
 *   node migrations/backup.js                     # Create backup with timestamp
 *   node migrations/backup.js --name my-backup   # Create backup with custom name
 *   node migrations/backup.js --list             # List available backups
 *   node migrations/backup.js --restore latest   # Restore from latest backup
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
require('dotenv').config();

const execAsync = util.promisify(exec);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify';
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Parse MongoDB URI to get connection details
 */
const parseMongoUri = (uri) => {
  const url = new URL(uri);
  return {
    host: url.hostname || 'localhost',
    port: url.port || '27017',
    database: url.pathname.slice(1) || 'fixify',
    username: url.username,
    password: url.password
  };
};

/**
 * Create a database backup
 */
const createBackup = async (backupName) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = backupName || `backup-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, name);
  
  console.log(`📦 Creating backup: ${name}`);
  console.log(`📁 Backup location: ${backupPath}`);
  
  try {
    const { host, port, database, username, password } = parseMongoUri(MONGODB_URI);
    
    // Build mongodump command
    let command = `mongodump --host ${host}:${port} --db ${database} --out "${backupPath}"`;
    
    if (username && password) {
      command += ` --username "${username}" --password "${password}"`;
    }
    
    console.log('🔄 Running mongodump...');
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done dumping')) {
      console.warn('⚠️  mongodump warnings:', stderr);
    }
    
    // Create metadata file
    const metadata = {
      name,
      createdAt: new Date().toISOString(),
      database,
      mongoUri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
      collections: []
    };
    
    // Get list of backed up collections
    const dbBackupPath = path.join(backupPath, database);
    if (fs.existsSync(dbBackupPath)) {
      const files = fs.readdirSync(dbBackupPath);
      metadata.collections = files
        .filter(file => file.endsWith('.bson'))
        .map(file => file.replace('.bson', ''));
    }
    
    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`✅ Backup created successfully: ${name}`);
    console.log(`📊 Collections backed up: ${metadata.collections.length}`);
    console.log(`📁 Location: ${backupPath}`);
    
    return { name, path: backupPath, metadata };
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    // Clean up failed backup
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    
    throw error;
  }
};

/**
 * List available backups
 */
const listBackups = () => {
  console.log('📋 Available backups:');
  console.log('===================');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('ℹ️  No backups found');
    return [];
  }
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(item => {
      const itemPath = path.join(BACKUP_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    })
    .map(name => {
      const backupPath = path.join(BACKUP_DIR, name);
      const metadataPath = path.join(backupPath, 'metadata.json');
      
      let metadata = { name, createdAt: 'Unknown' };
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (e) {
          // Ignore metadata read errors
        }
      }
      
      return {
        name,
        path: backupPath,
        createdAt: metadata.createdAt,
        collections: metadata.collections || []
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (backups.length === 0) {
    console.log('ℹ️  No backups found');
    return [];
  }
  
  backups.forEach((backup, index) => {
    const isLatest = index === 0;
    const date = new Date(backup.createdAt).toLocaleString();
    console.log(`${isLatest ? '📌' : '📦'} ${backup.name}`);
    console.log(`   Created: ${date}`);
    console.log(`   Collections: ${backup.collections.length}`);
    console.log(`   Path: ${backup.path}`);
    console.log('');
  });
  
  return backups;
};

/**
 * Restore from backup
 */
const restoreBackup = async (backupName) => {
  const backups = listBackups();
  
  let backup;
  if (backupName === 'latest') {
    backup = backups[0];
  } else {
    backup = backups.find(b => b.name === backupName);
  }
  
  if (!backup) {
    throw new Error(`Backup not found: ${backupName}`);
  }
  
  console.log(`🔄 Restoring backup: ${backup.name}`);
  console.log(`📁 From: ${backup.path}`);
  
  try {
    const { host, port, database, username, password } = parseMongoUri(MONGODB_URI);
    const dbBackupPath = path.join(backup.path, database);
    
    if (!fs.existsSync(dbBackupPath)) {
      throw new Error(`Backup data not found at: ${dbBackupPath}`);
    }
    
    // Build mongorestore command
    let command = `mongorestore --host ${host}:${port} --db ${database} --drop "${dbBackupPath}"`;
    
    if (username && password) {
      command += ` --username "${username}" --password "${password}"`;
    }
    
    console.log('🔄 Running mongorestore...');
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done')) {
      console.warn('⚠️  mongorestore warnings:', stderr);
    }
    
    console.log(`✅ Database restored successfully from: ${backup.name}`);
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
};

/**
 * Main function
 */
const main = async () => {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--list')) {
      listBackups();
      return;
    }
    
    if (args.includes('--restore')) {
      const backupName = args[args.indexOf('--restore') + 1] || 'latest';
      await restoreBackup(backupName);
      return;
    }
    
    // Create backup
    const nameIndex = args.indexOf('--name');
    const backupName = nameIndex !== -1 ? args[nameIndex + 1] : undefined;
    
    await createBackup(backupName);
    
  } catch (error) {
    console.error('💥 Backup script error:', error.message);
    process.exit(1);
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
  createBackup,
  listBackups,
  restoreBackup
};
