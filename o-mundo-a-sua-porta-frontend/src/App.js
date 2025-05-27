import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material'; // Added Box, Button
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BudgetPage from './components/modules/02_budgetModule/BudgetPage';
import LinksAcessoPage from './components/LinksAcessoPage'; // Import LinksAcessoPage
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

// Tema básico do Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f4f6f8',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
    },
  },
});

// Placeholder for LoginPage
const LoginPage = () => (
  <Box sx={{ textAlign: 'center', mt: 5 }}>
    <Typography variant="h4">Login Page</Typography>
    <Typography>This is a placeholder for the login page.</Typography>
    <Button component="a" href="/dashboard" variant="contained" sx={{mt: 2}}>Go to Dashboard (Simulated Login)</Button>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppBar position="static">
          <Toolbar>
            <TravelExploreIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              O Mundo à Sua Porta - Agência de Viagens
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/" element={<Navigate replace to="/login" />} /> {/* Redirect root to login */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/budgets" element={<BudgetPage />} />
            <Route path="/dashboard/links-acesso" element={<LinksAcessoPage />} /> {/* Added route for LinksAcessoPage */}
            {/* Other module routes could be added here or dynamically */}
          </Routes>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
