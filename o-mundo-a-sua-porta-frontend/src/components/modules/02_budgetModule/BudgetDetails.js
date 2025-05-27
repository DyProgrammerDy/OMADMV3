import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  Event as EventIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Label as LabelIcon,
  Flag as FlagIcon, // For status
  CalendarToday as CalendarTodayIcon, // For created_at/updated_at
  ListAlt as ListAltIcon // For budget items
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import budgetService from './budgetService'; // To fetch budget items

// Helper to display data or a placeholder
const DetailItem = ({ icon, label, value, isChip, chipColor }) => (
  <ListItem>
    <ListItemIcon sx={{ minWidth: '40px' }}>{icon}</ListItemIcon>
    <ListItemText
      primary={label}
      secondary={
        isChip ? (
          <Chip label={value || 'N/A'} color={chipColor || 'default'} size="small" sx={{ mt: 0.5 }} />
        ) : (
          value || 'N/A'
        )
      }
      primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'medium' }}
      secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
    />
  </ListItem>
);

const getStatusChipColor = (status) => {
  switch (status) {
    case 'draft': return 'default';
    case 'sent': return 'info';
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'invoiced': return 'warning';
    default: return 'default';
  }
};

const BudgetDetails = ({ budget, onEdit, onClose }) => {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState(null);

  useEffect(() => {
    if (budget?.id) {
      setLoadingItems(true);
      setErrorItems(null);
      budgetService.getBudgetItems(budget.id)
        .then(data => setItems(data || []))
        .catch(err => {
          console.error("Error fetching budget items:", err);
          setErrorItems("Failed to load budget items.");
        })
        .finally(() => setLoadingItems(false));
    } else {
      setItems([]); // Clear items if no budget or budget ID
    }
  }, [budget]);

  if (!budget) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
        <Typography variant="h6">No Budget Selected</Typography>
        <Typography variant="body1" color="text.secondary">
          Please select a budget from the list to see its details.
        </Typography>
      </Paper>
    );
  }

  const {
    id,
    name,
    client_id,
    package_id,
    description,
    total_value,
    currency,
    status,
    valid_until,
    created_at,
    updated_at,
  } = budget;

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="div" gutterBottom>
          Budget: {name}
        </Typography>
        <Button onClick={onClose} variant="outlined" size="small">Close Details</Button>
      </Box>
      <Divider sx={{ mb: 2 }}/>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <List dense>
            <DetailItem icon={<LabelIcon />} label="Budget Name" value={name} />
            <DetailItem icon={<PersonIcon />} label="Client ID" value={client_id} />
            <DetailItem icon={<CategoryIcon />} label="Package ID" value={package_id || 'N/A'} />
            <DetailItem icon={<DescriptionIcon />} label="Description" value={description} />
          </List>
        </Grid>
        <Grid item xs={12} md={6}>
          <List dense>
            <DetailItem
              icon={<AttachMoneyIcon />}
              label="Total Value"
              value={`${currency} ${parseFloat(total_value).toFixed(2)}`}
            />
            <DetailItem
              icon={<FlagIcon />}
              label="Status"
              value={status?.toUpperCase()}
              isChip
              chipColor={getStatusChipColor(status)}
            />
            <DetailItem
              icon={<EventIcon />}
              label="Valid Until"
              value={valid_until ? format(parseISO(valid_until), 'dd/MM/yyyy') : 'N/A'}
            />
             <DetailItem
              icon={<CalendarTodayIcon />}
              label="Created On"
              value={created_at ? format(parseISO(created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
            />
            <DetailItem
              icon={<CalendarTodayIcon />}
              label="Last Updated"
              value={updated_at ? format(parseISO(updated_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
            />
          </List>
        </Grid>
      </Grid>
      
      {onEdit && budget.status !== 'invoiced' && budget.status !== 'approved' && (
         <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={() => onEdit(budget)}>Edit Budget</Button>
         </Box>
      )}

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ListAltIcon sx={{ mr: 1 }} /> Budget Items
      </Typography>
      {loadingItems && <CircularProgress size={24} sx={{my: 2}}/>}
      {errorItems && <Alert severity="error" sx={{my: 2}}>{errorItems}</Alert>}
      {!loadingItems && !errorItems && items.length === 0 && (
        <Typography color="text.secondary" sx={{my: 2}}>No items added to this budget yet.</Typography>
      )}
      {!loadingItems && !errorItems && items.length > 0 && (
        <List dense>
          {items.map(item => (
            <ListItem key={item.id} secondaryAction={
              <Typography variant="body2">{`${item.quantity || 1} x ${parseFloat(item.unit_price).toFixed(2)} = ${parseFloat(item.total_price).toFixed(2)} ${currency}`}</Typography>
            }>
              <ListItemText
                primary={item.item_description}
                secondary={`Supplier ID: ${item.supplier_id || 'N/A'}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default BudgetDetails;

