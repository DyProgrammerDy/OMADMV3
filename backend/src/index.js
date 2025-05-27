const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./db');
const budgetRoutes = require('./routes/budgetRoutes');
const { loadExistingModules } = require('./modules/watcher');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? 'healthy' : 'database_error',
    timestamp: new Date().toISOString()
  });
});

// Mount budget routes under /api/budgets
app.use('/api/budgets', budgetRoutes);

const modulesDir = path.join(__dirname, 'modules', 'addons');

// Function to load and register routes from active modules
async function loadAndRegisterModuleRoutes(expressApp) {
  console.log('Attempting to load and register module routes...');
  try {
    const { rows: activeModules } = await pool.query(
      'SELECT module_key, name FROM dashboard_modules WHERE is_active = TRUE ORDER BY order_index ASC'
    );

    if (activeModules.length === 0) {
      console.log('No active modules found to load routes from.');
      return;
    }

    console.log(`Found ${activeModules.length} active module(s).`);

    const addonFolders = await fs.readdir(modulesDir);

    for (const moduleRecord of activeModules) {
      const moduleKey = moduleRecord.module_key;
      let modulePathFound = null;

      // Find the corresponding folder in addons. This assumes manifest.json module_key matches db module_key.
      for (const folder of addonFolders) {
        const manifestPath = path.join(modulesDir, folder, 'manifest.json');
        try {
          await fs.access(manifestPath); // Check if manifest.json exists
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifestData = JSON.parse(manifestContent);
          if (manifestData.module_key === moduleKey) {
            modulePathFound = path.join(modulesDir, folder);
            break;
          }
        } catch (err) {
          // ENOENT is fine (no manifest), SyntaxError for bad JSON
          if (err.code !== 'ENOENT' && !(err instanceof SyntaxError)) {
            console.error(`Error reading manifest in ${folder} while trying to load routes for ${moduleKey}:`, err);
          } else if (err instanceof SyntaxError) {
             console.error(`Syntax error in manifest file ${manifestPath} for module ${moduleKey}`);
          }
        }
      }

      if (modulePathFound) {
        const moduleIndexPath = path.join(modulePathFound, 'index.js');
        try {
          await fs.access(moduleIndexPath); // Check if module's index.js exists
          const moduleExports = require(moduleIndexPath); // Dynamically require the module's index.js

          if (moduleExports && moduleExports.routes) {
            expressApp.use(`/api/${moduleKey}`, moduleExports.routes);
            console.log(`Successfully registered routes for module: ${moduleKey} under /api/${moduleKey}`);
          } else {
            console.warn(`Module ${moduleKey} (in ${modulePathFound}) does not export 'routes' or is improperly structured.`);
          }
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.warn(`Module ${moduleKey} is active but its index.js was not found at ${moduleIndexPath}`);
          } else {
            console.error(`Error loading routes for module ${moduleKey} from ${moduleIndexPath}:`, err);
          }
        }
      } else {
        console.warn(`Module ${moduleKey} is active in DB, but no corresponding directory/manifest found in addons.`);
      }
    }
  } catch (error) {
    console.error('Failed to load or register module routes:', error);
  }
}

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

// Start server only if database connects
const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    
    // Test database connection first
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Start express server
    app.listen(port, async () => {
      console.log(`✓ Server running at http://localhost:${port}`);
      
      try {
        console.log('Loading modules...');
        await loadExistingModules();
        console.log('✓ Modules loaded into database');
        
        await loadAndRegisterModuleRoutes(app);
        console.log('✓ Module routes registered');
        
        console.log('Application startup complete!');
      } catch (error) {
        console.error('Module initialization error:', error);
        // Don't exit - let the server continue running even if modules fail
      }
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

// Start the server
console.log('Initializing application...');
startServer();
