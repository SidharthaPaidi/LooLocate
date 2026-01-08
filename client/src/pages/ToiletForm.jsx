import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import { toiletsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MyLocationIcon from '@mui/icons-material/MyLocation';


const ToiletForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    genderAccess: 'Unisex',
    isPaid: false,
    price: 0,
    isAccessible: false,
    hasSanitaryPadDisposal: false,
    cleanlinessRating: 0,
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const {user, logout, isAuthenticated} = useAuth();

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN || ''}`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const newLocation = data.features[0].place_name;
              setFormData((prev) => ({ ...prev, location: newLocation }));
            }
          } catch (err) {
            console.error('Geocoding error:', err);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchToilet();
    }
  }, [id]);

  const fetchToilet = async () => {
    setFetching(true);
    try {
      const response = await toiletsAPI.getById(id);
      if (response.data.success) {
        const toilet = response.data.data.toilet;
        setFormData({
          title: toilet.title || '',
          location: toilet.location || '',
          description: toilet.description || '',
          genderAccess: toilet.genderAccess || 'Unisex',
          isPaid: toilet.isPaid || false,
          price: toilet.price || 0,
          isAccessible: toilet.isAccessible || false,
          hasSanitaryPadDisposal: toilet.hasSanitaryPadDisposal || false,
          cleanlinessRating: toilet.cleanlinessRating || 0,
        });
        setExistingImages(toilet.images || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch toilet');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (image) => {
    setImagesToDelete([...imagesToDelete, image.filename]);
    setExistingImages(existingImages.filter((img) => img.filename !== image.filename));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        images,
        deleteImages: imagesToDelete.length > 0 ? imagesToDelete : undefined,
      };

      let response;
      if (isEdit) {
        response = await toiletsAPI.update(id, submitData);
      } else {
        response = await toiletsAPI.create(submitData);
      }

      if (response.data.success) {
        setSuccess(response.data.message || (isEdit ? 'Toilet updated successfully!' : 'Toilet created successfully!'));
        setTimeout(() => {
          navigate(`/toilets/${response.data.data.toiletId || id}`);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} toilet`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
        {isEdit ? 'Edit Toilet' : 'Add New Toilet'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="Location / Address"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            margin="normal"
            helperText="Enter the full address of the toilet location"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    sx={{ padding: "4px 8px", fontSize: "12px" }}
                    onClick={isAuthenticated ? handleLocationClick : () => navigate('/login')}
                  >
                  <MyLocationIcon  n sx={{ mr: 1 }}    /> Use My Location
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Gender Access</InputLabel>
            <Select
              name="genderAccess"
              value={formData.genderAccess}
              onChange={handleChange}
              label="Gender Access"
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Unisex">Unisex</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
              />
            }
            label="Paid Toilet"
            sx={{ mt: 2, mb: 1 }}
          />

          {formData.isPaid && (
            <TextField
              fullWidth
              label="Price (₹)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
          )}

          <FormControlLabel
            control={
              <Switch
                name="isAccessible"
                checked={formData.isAccessible}
                onChange={handleChange}
              />
            }
            label="Wheelchair Accessible"
            sx={{ mt: 2, mb: 1 }}
          />

          <FormControlLabel
            control={
              <Switch
                name="hasSanitaryPadDisposal"
                checked={formData.hasSanitaryPadDisposal}
                onChange={handleChange}
              />
            }
            label="Has Sanitary Pad Disposal"
            sx={{ mt: 2, mb: 1 }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Cleanliness Rating (Optional)</InputLabel>
            <Select
              name="cleanlinessRating"
              value={formData.cleanlinessRating}
              onChange={handleChange}
              label="Cleanliness Rating (Optional)"
            >
              <MenuItem value={0}>Not Rated</MenuItem>
              <MenuItem value={1}>1 Star</MenuItem>
              <MenuItem value={2}>2 Stars</MenuItem>
              <MenuItem value={3}>3 Stars</MenuItem>
              <MenuItem value={4}>4 Stars</MenuItem>
              <MenuItem value={5}>5 Stars</MenuItem>
            </Select>
          </FormControl>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Images
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {existingImages.map((img, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={img.url}
                      alt={`Existing ${idx + 1}`}
                      sx={{
                        width: 150,
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '2px solid #e0e0e0',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveExistingImage(img)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* New Images */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Images
            </Typography>
            <Button variant="outlined" component="label" sx={{ mb: 2 }}>
              Upload Images
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {images.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                {images.map((img, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={URL.createObjectURL(img)}
                      alt={`New ${idx + 1}`}
                      sx={{
                        width: 150,
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '2px solid #e0e0e0',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(idx)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ flexGrow: 1, bgcolor: 'primary.main' }}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Toilet' : 'Create Toilet'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ToiletForm;
