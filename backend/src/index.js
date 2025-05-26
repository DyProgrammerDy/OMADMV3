const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const db = require('./db');
const { loadExistingModules } = require('./modules/watcher');

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
        // Check if manifest exists before trying to read
        await fs.access(manifestPath);
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifestData = JSON.parse(manifestContent);

        // Query database for is_active status
        const dbResult = await db.query(
          'SELECT is_active FROM dashboard_modules WHERE module_key = $1',
          [manifestData.module_key]
        );

        let isActive = false;
        if (dbResult.rows.length > 0) {
          isActive = dbResult.rows[0].is_active;
        }

        availableModules.push({
          module_key: manifestData.module_key,
          name: manifestData.name,
          description: manifestData.description,
          icon_name: manifestData.icon,
          version: manifestData.version,
          is_active: isActive,
        });
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error processing manifest in ${folder}:`, err);
        }
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
    let dbResult = await db.query(
      'SELECT * FROM dashboard_modules WHERE module_key = $1',
      [moduleKey]
    );

    let updatedModule;

    if (dbResult.rows.length > 0) {
      const currentStatus = dbResult.rows[0].is_active;
      const updateResult = await db.query(
        'UPDATE dashboard_modules SET is_active = $1 WHERE module_key = $2 RETURNING *',
        [!currentStatus, moduleKey]
      );
      updatedModule = updateResult.rows[0];
    } else {
      const moduleFolders = await fs.readdir(modulesDir);
      let moduleData;

      for (const folder of moduleFolders) {
        const modulePath = path.join(modulesDir, folder, 'module.json');
        try {
          const moduleContent = await fs.readFile(modulePath, 'utf-8');
          const data = JSON.parse(moduleContent);
          if (data.module_key === moduleKey) {
            moduleData = data;
            break;
          }
        } catch (err) {
          console.error(`Error reading module in ${folder}:`, err);
        }
      }

      if (!moduleData) {
        return res.status(404).json({ error: `Module ${moduleKey} not found` });
      }

      const insertResult = await db.query(
        `INSERT INTO dashboard_modules 
         (name, title, description, icon_name, module_key, is_active, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          moduleData.name,
          moduleData.title,
          moduleData.description,
          moduleData.icon_name,
          moduleData.module_key,
          true,
          moduleData.order_index
        ]
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
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        await loadExistingModules();
    } catch (error) {
        console.error('Error loading modules:', error);
    }
});
