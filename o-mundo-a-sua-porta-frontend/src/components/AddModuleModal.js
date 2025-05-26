// filepath: o-mundo-a-sua-porta-frontend/src/components/AddModuleModal.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Typography
} from '@mui/material';
import * as MuiIcons from '@mui/icons-material';

const DynamicIcon = ({ name }) => {
  const IconComponent = MuiIcons[name];
  return IconComponent ? <IconComponent /> : <MuiIcons.Extension />;
};

function AddModuleModal({ open, onClose, availableModules, activeModuleKeys, onToggleModule }) {
  const inactiveModules = availableModules.filter(
    module => !activeModuleKeys.includes(module.module_key)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Função</DialogTitle>
      <DialogContent>
        {inactiveModules.length === 0 ? (
          <Typography color="textSecondary">
            Todas as funções já estão ativas no painel.
          </Typography>
        ) : (
          <List>
            {inactiveModules.map((module) => (
              <ListItem key={module.module_key}>
                <ListItemIcon>
                  <DynamicIcon name={module.icon_name || 'Extension'} />
                </ListItemIcon>
                <ListItemText 
                  primary={module.name}
                  secondary={module.description}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    onToggleModule(module.module_key);
                    onClose();
                  }}
                >
                  Ativar
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AddModuleModal;