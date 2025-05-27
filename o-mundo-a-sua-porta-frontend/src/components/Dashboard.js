import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Card, CardContent, Typography, CardActions, Button, CircularProgress, Alert, Box, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import LaunchIcon from '@mui/icons-material/Launch'; // For the "Open" button
import LinkIcon from '@mui/icons-material/Link'; // Import LinkIcon
import * as MuiIcons from '@mui/icons-material'; // Importar todos os ícones para uso dinâmico
import AddModuleModal from './AddModuleModal';
import apiClient from '../services/apiClient'; // Criaremos este
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Import useNavigate and RouterLink

const DynamicIcon = ({ name }) => {
  const IconComponent = MuiIcons[name];
  return IconComponent ? <IconComponent sx={{ fontSize: 40, mb: 1 }} color="primary" /> : <MuiIcons.Extension sx={{ fontSize: 40, mb: 1 }} color="action" />;
};

function Dashboard() {
  const [activeModules, setActiveModules] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeRes, availableRes] = await Promise.all([
        apiClient.get('/modules/active'),
        apiClient.get('/modules/available'),
      ]);
      setActiveModules(activeRes.data);
      setAvailableModules(availableRes.data);

    } catch (err) {
      console.error("Erro ao buscar módulos:", err);
      setError("Não foi possível carregar os módulos. Verifique a conexão com o backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleToggleModule = async (moduleKey) => {
    try {
      await apiClient.post(`/modules/${moduleKey}/toggle`);
      fetchData(); // Re-busca os dados para atualizar o estado
    } catch (err) {
      console.error(`Erro ao alternar módulo ${moduleKey}:`, err);
      setError(`Erro ao atualizar o módulo ${moduleKey}.`);
    }
  };

  const handleOpenModule = (moduleKey) => {
    // This is where you'll define navigation for each module
    // For now, we only have 'budgetModule'
    if (moduleKey === 'budgetModule') {
      navigate('/dashboard/budgets');
    } else {
      // You can add a default behavior or navigation for other modules here
      console.warn(`Navigation not yet implemented for module: ${moduleKey}`);
      // Example: navigate(`/dashboard/${moduleKey.toLowerCase().replace('module', '')}`);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      <Typography variant="h5" gutterBottom component="div" sx={{ mb: 3 }}>
        Painel de Funções
      </Typography>
      <Grid container spacing={3}>
        {/* Static Card for Links de Acesso */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', transition: '0.3s', '&:hover': { boxShadow: 6 } }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <LinkIcon sx={{ fontSize: 40, mb: 1 }} color="primary" />
              <Typography gutterBottom variant="h6" component="div">
                Links de Acesso
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gerenciar links para sistemas externos e credenciais.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', p: 2 }}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<LaunchIcon />}
                component={RouterLink}
                to="/dashboard/links-acesso"
              >
                Abrir
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Dynamic Modules */}
        {activeModules.map((module) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={module.module_key}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', transition: '0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <DynamicIcon name={module.icon_name || 'Extension'} />
                <Typography gutterBottom variant="h6" component="div">
                  {module.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {module.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', p: 2, columnGap: 1 /* Added gap */ }}>
                <Button 
                    size="small" 
                    variant="contained" 
                    color="primary" // Changed to primary for "Open"
                    startIcon={<LaunchIcon />}
                    onClick={() => handleOpenModule(module.module_key)}
                    // Disable if module_key is not recognized or no path exists
                    // disabled={module.module_key !== 'budgetModule'} // Example: only enable for budgetModule for now
                >
                  Abrir
                </Button>
                <Button 
                    size="small" 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => handleToggleModule(module.module_key)}
                >
                  Desativar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
         {activeModules.length === 0 && !loading && (
            <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary" align="center" sx={{mt: 4}}>
                    Nenhuma função ativa. Clique no botão "+" para adicionar funções ao painel.
                </Typography>
            </Grid>
        )}
      </Grid>

      <AddModuleModal
        open={isModalOpen}
        onClose={handleCloseModal}
        availableModules={availableModules}
        activeModuleKeys={activeModules.map(m => m.module_key)}
        onToggleModule={handleToggleModule}
      />

      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpenModal}
        sx={{
          position: 'fixed',
          top: (theme) => theme.spacing(10),
          right: (theme) => theme.spacing(4),
        }}
      >
        <AddIcon />
      </Fab>

      <Fab
        color="secondary"
        aria-label="open folder"
        onClick={() => window.open('file:///E:/001SistemaADM/Mod1/ModularOMundoADM2025/backend/src/modules/addons')}
        sx={{
          position: 'fixed',
          top: (theme) => theme.spacing(20), // Position below the first FAB
          right: (theme) => theme.spacing(4),
        }}
      >
        <FolderOpenIcon />
      </Fab>
    </>
  );
}

export default Dashboard;
