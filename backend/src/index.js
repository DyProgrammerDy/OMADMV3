const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const db = require('./db'); // Assuming db.js is in the same directory

const app = express();

app.use(cors());
app.use(express.json());

const modulesDir = path.join(__dirname, 'modules', 'addons');

// GET /api/modules/available
app.get('/api/modules/available', async (req, res) => {
  try {
    const moduleFolders = await fs.readdir(modulesDir);
    const availableModules = [];

    for (const folder of moduleFolders) {
      const manifestPath = path.join(modulesDir, folder, 'manifest.json');
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        // Query database for is_active status
        const dbResult = await db.query(
          'SELECT is_active FROM dashboard_modules WHERE module_key = $1',
          [manifest.module_key]
        );

        let isActive = false;
        if (dbResult.rows.length > 0) {
          isActive = dbResult.rows[0].is_active;
        }

        availableModules.push({
          module_key: manifest.module_key,
          name: manifest.name,
          description: manifest.description,
          icon: manifest.icon, // from manifest
          version: manifest.version,
          is_active: isActive,
        });
      } catch (err) {
        // Log error for specific manifest, but continue with others
        console.error(`Error processing manifest in ${folder}:`, err);
        // Optionally, you could add a placeholder or error object to the response
      }
    }
    res.json(availableModules);
  } catch (err) {
    console.error('Error reading available modules:', err);
    res.status(500).json({ error: 'Failed to retrieve available modules' });
  }
});

// GET /api/modules/active
app.get('/api/modules/active', async (req, res) => {
  try {
    const dbResult = await db.query(
      'SELECT module_key, name, description, icon_name FROM dashboard_modules WHERE is_active = TRUE'
    );
    res.json(dbResult.rows);
  } catch (err) {
    console.error('Error retrieving active modules:', err);
    res.status(500).json({ error: 'Failed to retrieve active modules' });
  }
});

// POST /api/modules/:moduleKey/toggle
app.post('/api/modules/:moduleKey/toggle', async (req, res) => {
  const { moduleKey } = req.params;

  try {
    // Check if module exists in the database
    let dbResult = await db.query(
      'SELECT id, module_key, name, description, icon_name, is_active FROM dashboard_modules WHERE module_key = $1',
      [moduleKey]
    );

    let updatedModule;

    if (dbResult.rows.length > 0) {
      // Module exists, toggle its status
      const currentStatus = dbResult.rows[0].is_active;
      const updateResult = await db.query(
        'UPDATE dashboard_modules SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE module_key = $2 RETURNING id, module_key, name, description, icon_name, is_active',
        [!currentStatus, moduleKey]
      );
      updatedModule = updateResult.rows[0];
    } else {
      // Module does not exist, find its manifest and insert it
      const moduleFolders = await fs.readdir(modulesDir);
      let manifest;
      let foundManifest = false;

      for (const folder of moduleFolders) {
        const manifestPath = path.join(modulesDir, folder, 'manifest.json');
        try {
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const currentManifest = JSON.parse(manifestContent);
          if (currentManifest.module_key === moduleKey) {
            manifest = currentManifest;
            foundManifest = true;
            break;
          }
        } catch (err) {
          console.error(`Error reading manifest in ${folder} while toggling:`, err);
          // Continue to check other manifests
        }
      }

      if (!foundManifest) {
        return res.status(404).json({ error: `Module with key ${moduleKey} not found in manifests` });
      }

      const insertResult = await db.query(
        'INSERT INTO dashboard_modules (module_key, name, description, icon_name, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, module_key, name, description, icon_name, is_active',
        [manifest.module_key, manifest.name, manifest.description, manifest.icon] // manifest.icon is used for icon_name
      );
      updatedModule = insertResult.rows[0];
    }
    res.json(updatedModule);
  } catch (err) {
    console.error(`Error toggling module ${moduleKey}:`, err);
    res.status(500).json({ error: `Failed to toggle module ${moduleKey}` });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
