import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Container } from '@mui/material';
import Dashboard from './components/Dashboard';
import TravelExploreIcon from '@mui/icons-material/TravelExplore'; // Ícone para o AppBar

// Tema básico do Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Azul padrão
    },
    secondary: {
      main: '#dc004e', // Rosa padrão
    },
    background: {
      default: '#f4f6f8', // Um cinza claro para o fundo
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normaliza estilos e aplica cor de fundo */}
      <AppBar position="static">
        <Toolbar>
          <TravelExploreIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            O Mundo à Sua Porta - Agência de Viagens
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Dashboard />
      </Container>
    </ThemeProvider>
  );
}

export default App;
