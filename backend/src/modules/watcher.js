const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const db = require('../db');

const ADDONS_PATH = path.join(__dirname, 'addons');

async function loadModule(filePath) {
    try {
        // Check if file exists before trying to read
        await fs.access(filePath);
        console.log(`Processing module: ${filePath}`);
        
        const fileContent = await fs.readFile(filePath, 'utf8');
        const manifestData = JSON.parse(fileContent);

        // Check if module exists
        const existingModule = await db.query(
            'SELECT * FROM dashboard_modules WHERE module_key = $1',
            [manifestData.module_key]
        );

        if (existingModule.rows.length === 0) {
            await db.query(
                `INSERT INTO dashboard_modules 
                (module_key, name, title, description, icon_name, version, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    manifestData.module_key,
                    manifestData.name,
                    manifestData.name,
                    manifestData.description,
                    manifestData.icon,
                    manifestData.version,
                    false
                ]
            );
            console.log(`Added new module: ${manifestData.name}`);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Error processing module at ${filePath}:`, error);
        }
    }
}

async function loadExistingModules() {
    try {
        const folders = await fs.readdir(ADDONS_PATH);
        
        for (const folder of folders) {
            const manifestPath = path.join(ADDONS_PATH, folder, 'manifest.json');
            await loadModule(manifestPath);
        }
        
        console.log('Finished loading existing modules');
    } catch (error) {
        console.error('Error loading modules directory:', error);
    }
}

// Watch for manifest.json files
const watcher = chokidar.watch(path.join(ADDONS_PATH, '**/manifest.json'), {
    ignored: /(^|[\/\\])\../,
    persistent: true
});

watcher.on('add', loadModule);
watcher.on('change', loadModule);

module.exports = {
    loadModule,
    loadExistingModules,
    watcher
};