import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Button,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import { toiletsAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import Masonry from '@mui/lab/Masonry';

const ToiletList = () => {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialValues = {
    location: searchParams.get('location') || '',
    paid: searchParams.get('paid') || '',
    maxDistance: searchParams.get('maxDistance') || '1',
  };

  const fetchToilets = async (filters = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.location) params.location = filters.location;
      if (filters.paid) params.paid = filters.paid;
      if (filters.maxDistance) params.maxDistance = filters.maxDistance;

      const response = await toiletsAPI.getAll(params);
      if (response.data.success) {
        setToilets(response.data.data.toilets || []);
        const newParams = new URLSearchParams(params);
        setSearchParams(newParams);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch toilets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToilets(initialValues);
  }, []);

  const handleSearch = (filters) => {
    fetchToilets(filters);
  };

  const [showFloatingSearch, setShowFloatingSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowFloatingSearch(scrollY > 130);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Box sx={{ width: '100%', bgcolor: 'primary.main', py: 2, mb: 4, boxShadow: 3, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ transform: 'scale(0.95)', transformOrigin: 'center' }}>
          <SearchBar onSearch={handleSearch} initialValues={initialValues} />
        </Box>
      </Box>

      {/* Floating Search Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          py: 1,
          display: 'flex',
          justifyContent: 'center',
          transform: showFloatingSearch ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Box sx={{ transform: 'scale(1)', transformOrigin: 'center' }}>
          <SearchBar onSearch={handleSearch} initialValues={initialValues} />
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ p: 5, display: 'flex', flexFlow: 'column', gap: 3, minHeight: '80vh' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : toilets.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" component="div" gutterBottom>
              🚽 No Toilets Found
            </Typography>
            <Typography color="text.secondary" component="div" sx={{ mb: 3 }}>
              Try adjusting your filters or search for a different location.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/toilets/new')}>
              Add the First Toilet
            </Button>
          </Paper>
        ) : (
          <Masonry
            columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
            spacing={3}
            sx={{
              marginTop:"-30px"
            }}
          >
            {toilets.map((toilet) => (
              <Card
                key={toilet._id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 },
                }}
                onClick={() => navigate(`/toilets/${toilet._id}`)}
              >
                <CardMedia
                  sx={{ height: 140 }}
                  image={
                    toilet.images?.[0]?.url ||
                    'https://via.placeholder.com/400x200?text=No+Image'
                  }
                  title={toilet.title}
                />

                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography
                    variant="h6"
                    component="span"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {toilet.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    component="div"
                    color="text.secondary"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
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

                  {toilet.cleanlinessRating != null ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StarIcon sx={{ fontSize: 16, color: '#fbc02d', mr: 0.5 }} />
                      {toilet.cleanlinessRating.toFixed(1)}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No rating
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                    sx={{ mt: 'auto' }}
                  >
                    Added by: {toilet.author?.username || 'Unknown'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Masonry>

        )}
      </Container>
    </>
  );
};

export default ToiletList;