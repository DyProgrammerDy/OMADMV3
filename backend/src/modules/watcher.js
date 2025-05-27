const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../db');

// Define the addons path
const ADDONS_PATH = path.join(__dirname, 'addons');

async function loadModule(filePath) {
    try {
        await fs.access(filePath);
        console.log(`Processing module manifest: ${filePath}`);
        
        const fileContent = await fs.readFile(filePath, 'utf8');
        const manifestData = JSON.parse(fileContent);

        if (!manifestData.module_key || !manifestData.name || !manifestData.title) {
            console.error(`Skipping module due to missing essential data (module_key, name, title) in manifest: ${filePath}`);
            return;
        }

        const existingModule = await pool.query(
            'SELECT id, is_active FROM dashboard_modules WHERE module_key = $1',
            [manifestData.module_key]
        );

        const isActiveFromManifest = manifestData.is_active === undefined ? true : manifestData.is_active;
        const orderIndexFromManifest = manifestData.order_index === undefined ? 0 : manifestData.order_index;

        if (existingModule.rows.length === 0) {
            // Module does not exist, insert it
            await pool.query(
                `INSERT INTO dashboard_modules 
                (module_key, name, title, description, icon_name, version, is_active, order_index, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [
                    manifestData.module_key,
                    manifestData.name,
                    manifestData.title,
                    manifestData.description,
                    manifestData.icon_name, // Corrected from manifestData.icon
                    manifestData.version,
                    isActiveFromManifest,   // Use value from manifest, default to true
                    orderIndexFromManifest  // Use value from manifest, default to 0
                ]
            );
            console.log(`Added new module to DB: ${manifestData.name}`);
        } else {
            // Module exists, update it
            // We generally trust the manifest as the source of truth for these details.
            // However, we might want to preserve the is_active status from the DB if not specified in manifest,
            // or if a user manually deactivated it via an admin interface.
            // For this implementation, we'll update is_active from the manifest if present.
            const dbIsActive = existingModule.rows[0].is_active;
            const finalIsActive = manifestData.is_active !== undefined ? manifestData.is_active : dbIsActive;

            await pool.query(
                `UPDATE dashboard_modules
                SET name = $1, title = $2, description = $3, icon_name = $4, version = $5, is_active = $6, order_index = $7, updated_at = CURRENT_TIMESTAMP
                WHERE module_key = $8`,
                [
                    manifestData.name,
                    manifestData.title,
                    manifestData.description,
                    manifestData.icon_name,
                    manifestData.version,
                    finalIsActive, 
                    orderIndexFromManifest,
                    manifestData.module_key
                ]
            );
            console.log(`Updated module in DB: ${manifestData.name}`);
        }
    } catch (error) {
        console.error(`Error processing module manifest at ${filePath}:`, error);
    }
}

const loadExistingModules = async () => {
  try {
    console.log('Loading existing modules...');
    const modulesDir = path.join(__dirname, 'addons');
    const folders = await fs.readdir(modulesDir);
    
    for (const folder of folders) {
      const manifestPath = path.join(modulesDir, folder, 'manifest.json');
      try {
        const data = await fs.readFile(manifestPath, 'utf-8');
        const moduleData = JSON.parse(data);
        // Process module data
        console.log(`Found module: ${moduleData.name}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error processing module in ${folder}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error loading existing modules:', err);
  }
};

// Watch for manifest.json files
const watcher = chokidar.watch(path.join(ADDONS_PATH, '**/manifest.json'), {
    ignored: /(^|[\/\\])\../,
    persistent: true
});

watcher.on('add', loadModule);
watcher.on('change', loadModule);

module.exports = {
    loadExistingModules,
    ADDONS_PATH
};