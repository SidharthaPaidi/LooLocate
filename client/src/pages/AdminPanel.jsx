import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toiletsAPI } from '../services/api';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [toilets, setToilets] = useState({ pending: [], approved: [], rejected: [] });
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionDialog, setActionDialog] = useState({ open: false, toilet: null, action: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchToilets();
  }, []);

  const fetchToilets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await toiletsAPI.getAdmin();
      if (response.data.success) {
        setToilets(response.data.data);
        setCounts(response.data.data.counts);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (toiletId, action) => {
    try {
      if (action === 'approve') {
        await toiletsAPI.approve(toiletId);
      } else if (action === 'reject') {
        await toiletsAPI.reject(toiletId);
      }
      setActionDialog({ open: false, toilet: null, action: '' });
      fetchToilets();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} toilet`);
    }
  };

  const openActionDialog = (toilet, action) => {
    setActionDialog({ open: true, toilet, action });
  };

  const currentToilets = tabValue === 0 ? toilets.pending : tabValue === 1 ? toilets.approved : toilets.rejected;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Admin Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Pending (${counts.pending})`} />
          <Tab label={`Approved (${counts.approved})`} />
          <Tab label={`Rejected (${counts.rejected})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : currentToilets.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} toilets
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {currentToilets.map((toilet) => (
            <Grid item xs={12} md={6} lg={4} key={toilet._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 },
                }}
                onClick={() => navigate(`/toilets/${toilet._id}`)}
              >
                {toilet.images?.[0] && (
                  <Box
                    component="img"
                    src={toilet.images[0].url}
                    alt={toilet.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {toilet.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                  >
                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {toilet.location}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={toilet.isPaid ? `₹${toilet.price || 0}` : 'Free'}
                      size="small"
                      color={toilet.isPaid ? 'default' : 'success'}
                    />
                    <Chip label={toilet.genderAccess} size="small" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Added by: {toilet.author?.username || 'Unknown'}
                  </Typography>
                  {tabValue === 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionDialog(toilet, 'approve');
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionDialog(toilet, 'reject');
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, toilet: null, action: '' })}>
        <DialogTitle>
          {actionDialog.action === 'approve' ? 'Approve' : 'Reject'} Toilet
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionDialog.action} "{actionDialog.toilet?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, toilet: null, action: '' })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog.action === 'approve' ? 'success' : 'error'}
            onClick={() => handleAction(actionDialog.toilet?._id, actionDialog.action)}
          >
            {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;
