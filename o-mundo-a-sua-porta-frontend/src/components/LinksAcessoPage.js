import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions as MuiDialogActions, // Renamed to avoid conflict with CardActions
  TextField,
  IconButton,
  Tooltip,
  Snackbar // Added Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import * as linksAcessoService from '../services/linksAcessoService';

const LinksAcessoPage = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateEditModal, setOpenCreateEditModal] = useState(false);
  const [currentLink, setCurrentLink] = useState(null); // Stores the link being edited
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nome_sistema: '',
    url_acesso: '',
    usuario: '',
    senha: '',
    observacoes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState('');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [linkToDeleteId, setLinkToDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await linksAcessoService.getAllLinks();
      setLinks(data || []);
    } catch (err) {
      console.error('Failed to fetch links:', err);
      setError(err.message || 'Erro ao buscar links de acesso. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleOpenCreateModal = () => {
    setCurrentLink(null);
    setIsEditMode(false);
    setFormData({ nome_sistema: '', url_acesso: '', usuario: '', senha: '', observacoes: '' });
    setFormErrors({});
    setModalError('');
    setOpenCreateEditModal(true);
  };

  const handleOpenEditModal = (link) => {
    setCurrentLink(link);
    setIsEditMode(true);
    setFormData({
      nome_sistema: link.nome_sistema || '',
      url_acesso: link.url_acesso || '',
      usuario: link.usuario || '',
      senha: '', // Password field is kept empty for edit
      observacoes: link.observacoes || '',
    });
    setFormErrors({});
    setModalError('');
    setOpenCreateEditModal(true);
  };

  const handleCloseModal = () => {
    setOpenCreateEditModal(false);
    setCurrentLink(null);
    setModalError('');
    setFormErrors({});
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nome_sistema.trim()) {
      errors.nome_sistema = 'Nome do sistema é obrigatório.';
    }
    if (!formData.url_acesso.trim()) {
      errors.url_acesso = 'URL de acesso é obrigatória.';
    } else {
      try {
        // Basic URL validation, not perfect but better than nothing
        new URL(formData.url_acesso.startsWith('http') ? formData.url_acesso : `http://${formData.url_acesso}`);
      } catch (_) {
        errors.url_acesso = 'URL de acesso inválida.';
      }
    }
    // Add other validations if needed (e.g., password complexity)
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveLink = async () => {
    if (!validateForm()) {
      return;
    }
    setModalLoading(true);
    setModalError('');

    const dataToSave = { ...formData };
    if (isEditMode && !dataToSave.senha) { // If editing and password field is empty
      delete dataToSave.senha; // Don't send empty password to backend
    }


    try {
      // let response; // response variable was not used, removed.
      if (isEditMode && currentLink) {
        await linksAcessoService.updateLink(currentLink.id, dataToSave);
        setSuccessSnackbarMessage('Link atualizado com sucesso!');
      } else {
        await linksAcessoService.createLink(dataToSave);
        setSuccessSnackbarMessage('Link criado com sucesso!');
      }
      
      handleCloseModal();
      await fetchLinks(); // Re-fetch links
      setShowSuccessSnackbar(true);

    } catch (err) {
      console.error('Failed to save link:', err);
      setModalError(err.response?.data?.error || err.message || 'Erro ao salvar o link.');
    } finally {
      setModalLoading(false);
    }
  };

  // Opens the delete confirmation dialog
  const handleDeleteLink = (id) => {
    setLinkToDeleteId(id);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setLinkToDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (!linkToDeleteId) return;
    setDeleteLoading(true);
    setError(''); // Clear previous main errors

    try {
      await linksAcessoService.deleteLink(linkToDeleteId);
      setSuccessSnackbarMessage('Link excluído com sucesso!');
      setShowSuccessSnackbar(true);
      await fetchLinks(); // Re-fetch links
    } catch (err) {
      console.error('Failed to delete link:', err);
      // Display error in the main error alert for simplicity
      setError(err.response?.data?.error || err.message || 'Erro ao excluir o link.');
    } finally {
      setDeleteLoading(false);
      handleCloseDeleteConfirm();
    }
  };

  const handleOpenUrl = (url) => {
    if (url) {
      // Ensure URL has a scheme
      let fullUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        fullUrl = `http://${url}`;
      }
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Gerenciador de Links de Acesso
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {links.length === 0 && !loading && !error && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 3 }}>
              Nenhum link de acesso cadastrado ainda. Clique no botão "+" para adicionar.
            </Typography>
          </Grid>
        )}
        {links.map((link) => (
          <Grid item xs={12} sm={6} md={4} key={link.id}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '5px solid', borderColor: 'primary.main' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                  {link.nome_sistema || 'Nome do Sistema não informado'}
                </Typography>
                <Typography sx={{ mb: 1.5, color: 'text.secondary', wordBreak: 'break-all' }} variant="body2">
                  URL: {link.url_acesso ? <a href="#" onClick={(e) => { e.preventDefault(); handleOpenUrl(link.url_acesso); }} style={{ color: 'inherit' }}>{link.url_acesso}</a> : 'Não informada'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Usuário: {link.usuario || 'Não informado'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Observações: {link.observacoes || 'Nenhuma'}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-around', borderTop: '1px solid #eee' }}>
                <Tooltip title="Abrir Link">
                  <IconButton onClick={() => handleOpenUrl(link.url_acesso)} color="primary" aria-label="abrir link">
                    <LaunchIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton onClick={() => handleOpenEditModal(link)} color="secondary" aria-label="editar link">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton onClick={() => handleDeleteLink(link.id)} color="error" aria-label="excluir link">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Fab
        color="primary"
        aria-label="adicionar link"
        onClick={handleOpenCreateModal}
        sx={{
          position: 'fixed',
          bottom: (theme) => theme.spacing(3),
          right: (theme) => theme.spacing(3),
        }}
      >
        <AddIcon />
      </Fab>

      {/* Modal for Create/Edit */}
      <Dialog open={openCreateEditModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? 'Editar Link de Acesso' : 'Criar Novo Link de Acesso'}</DialogTitle>
        <DialogContent>
          {modalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {modalError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="nome_sistema"
            label="Nome do Sistema"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nome_sistema}
            onChange={handleInputChange}
            error={!!formErrors.nome_sistema}
            helperText={formErrors.nome_sistema}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="url_acesso"
            label="URL de Acesso"
            type="url"
            fullWidth
            variant="outlined"
            value={formData.url_acesso}
            onChange={handleInputChange}
            error={!!formErrors.url_acesso}
            helperText={formErrors.url_acesso}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="usuario"
            label="Usuário"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.usuario}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="senha"
            label={isEditMode ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}
            type="password"
            fullWidth
            variant="outlined"
            value={formData.senha}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="observacoes"
            label="Observações"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.observacoes}
            onChange={handleInputChange}
          />
        </DialogContent>
        <MuiDialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseModal} color="secondary" disabled={modalLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSaveLink} variant="contained" color="primary" disabled={modalLoading}>
            {modalLoading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Link')}
          </Button>
        </MuiDialogActions>
      </Dialog>

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        message={successSnackbarMessage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Tem certeza que deseja excluir o link "
            {linkToDeleteId ? links.find(link => link.id === linkToDeleteId)?.nome_sistema : ''}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <MuiDialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseDeleteConfirm} color="secondary" disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteLoading} autoFocus>
            {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Excluir'}
          </Button>
        </MuiDialogActions>
      </Dialog>
    </Container>
  );
};

export default LinksAcessoPage;
