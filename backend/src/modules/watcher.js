const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const { getDB } = require('../db');

// Define the addons path
const ADDONS_PATH = path.join(__dirname, 'addons');

async function loadModule(filePath) {
    try {
        await fs.access(filePath);
        const pool = getDB(); // Get PostgreSQL pool instance
        console.log(`Processing module manifest: ${filePath}`);
        
        const fileContent = await fs.readFile(filePath, 'utf8');
        const manifestData = JSON.parse(fileContent);

        if (!manifestData.module_key || !manifestData.name || !manifestData.title) {
            console.error(`Skipping module due to missing essential data (module_key, name, title) in manifest: ${filePath}`);
            return;
        }

        const { rows: existingModuleRows } = await pool.query(
            'SELECT id, is_active FROM dashboard_modules WHERE module_key = $1',
            [manifestData.module_key]
        );

        const isActiveFromManifest = manifestData.is_active === undefined ? true : manifestData.is_active;
        const orderIndexFromManifest = manifestData.order_index === undefined ? 99 : manifestData.order_index; // Default to a higher number for new modules

        if (existingModuleRows.length === 0) {
            // Module does not exist, insert it
            await pool.query(
                `INSERT INTO dashboard_modules 
                (module_key, name, title, description, icon_name, version, is_active, order_index, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [
                    manifestData.module_key,
                    manifestData.name,
                    manifestData.title,
                    manifestData.description || '',
                    manifestData.icon_name || 'default_icon',
                    manifestData.version || '1.0.0',
                    isActiveFromManifest,
                    orderIndexFromManifest
                ]
            );
            console.log(`Added new module to DB: ${manifestData.name}`);
        } else {
            // Module exists, update it
            const dbIsActive = existingModuleRows[0].is_active;
            const finalIsActive = manifestData.is_active !== undefined ? manifestData.is_active : dbIsActive;

            let descriptionToUpdate = manifestData.description;
            if (manifestData.description === undefined && existingModuleRows[0].description !== undefined) {
                descriptionToUpdate = existingModuleRows[0].description;
            }

            let iconNameToUpdate = manifestData.icon_name;
            if (manifestData.icon_name === undefined && existingModuleRows[0].icon_name !== undefined) {
                iconNameToUpdate = existingModuleRows[0].icon_name;
            }

            let versionToUpdate = manifestData.version;
            if (manifestData.version === undefined && existingModuleRows[0].version !== undefined) {
                versionToUpdate = existingModuleRows[0].version;
            }

            await pool.query(
                `UPDATE dashboard_modules
                SET name = $1, title = $2, description = $3, icon_name = $4, version = $5, is_active = $6, order_index = $7, updated_at = CURRENT_TIMESTAMP
                WHERE module_key = $8`,
                [
                    manifestData.name,
                    manifestData.title,
                    descriptionToUpdate || '',
                    iconNameToUpdate || 'default_icon',
                    versionToUpdate || '1.0.0',
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
    console.log('Loading existing modules from filesystem to sync with DB...');
    const folders = await fs.readdir(ADDONS_PATH); // Use defined ADDONS_PATH
    
    for (const folder of folders) {
      const manifestPath = path.join(ADDONS_PATH, folder, 'manifest.json');
      try {
        // Check if manifest.json exists before trying to load it
        await fs.access(manifestPath); 
        await loadModule(manifestPath); // Call the refactored loadModule to process and sync with DB
      } catch (err) {
        if (err.code !== 'ENOENT') {
          // ENOENT means manifest.json not found, which is fine for a folder that isn't a module.
          // Log other errors that occur during the processing of an existing manifest.
          console.error(`Error during initial load of module in ${folder} (manifest: ${manifestPath}):`, err);
        }
      }
    }
    console.log('Finished initial loading of existing modules.');
  } catch (err) {
    // This would be an error reading the ADDONS_PATH directory itself.
    console.error('Error reading addons directory during initial module load:', err);
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