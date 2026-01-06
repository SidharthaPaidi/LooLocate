import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, CircularProgress, Typography, Alert } from '@mui/material';
import api from '../services/api';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No token received from Google authentication');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Store token
        localStorage.setItem('token', token);
        
        // Fetch user data with the token
        const response = await api.get('/me');
        
        if (response.data.success) {
          // Store user data
          localStorage.setItem('user', JSON.stringify(response.data.user));
          // Navigate to toilets page
          navigate('/toilets');
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        localStorage.removeItem('token');
        setError('Failed to verify authentication. Please try logging in again.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 3 }}>
          Completing Google sign in...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return null;
};

export default GoogleCallback;
