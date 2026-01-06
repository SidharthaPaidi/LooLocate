import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardMedia,
  Chip,
  Button,
  Grid,
  Paper,
  Divider,
  Rating,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toiletsAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ToiletDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [toilet, setToilet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchToilet();
  }, [id]);

  const fetchToilet = async () => {
    setLoading(true);
    try {
      const response = await toiletsAPI.getById(id);
      if (response.data.success) {
        setToilet(response.data.data.toilet);
      } else {
        setError('Toilet not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch toilet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this toilet?')) return;
    try {
      await toiletsAPI.delete(id);
      navigate('/toilets');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete toilet');
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this toilet listing?')) return;
    try {
      await toiletsAPI.reject(id);
      navigate('/toilets');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject toilet listing');
    }
  };

  const handleReviewSubmit = async () => {
    setSubmittingReview(true);
    try {
      await reviewsAPI.create(id, {
        review: {
          rating: reviewForm.rating,
          body: reviewForm.body,
        },
      });
      setReviewDialogOpen(false);
      setReviewForm({ rating: 5, body: '' });
      fetchToilet(); // Refresh to show new review
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const userHasReviewed = toilet?.reviews?.some(
    (review) => {
      const reviewAuthorId = review.author?._id || review.author?.id;
      const userId = user?.id || user?._id;
      return reviewAuthorId && userId && reviewAuthorId.toString() === userId.toString();
    }
  );

  const isOwner = user && toilet && (() => {
    const authorId = toilet.author?._id || toilet.author?.id;
    const userId = user?.id || user?._id;
    return authorId && userId && authorId.toString() === userId.toString();
  })();

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !toilet) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} to="/toilets" sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Container>
    );
  }

  if (!toilet) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/toilets')}
        sx={{ mb: 3 }}
      >
        Back to List
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Column - Images & Details */}
        <Grid item xs={12} md={7} size={4} sx={{}}>
          <Grid>
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height={400}
                image={toilet.images?.[0]?.url || 'https://via.placeholder.com/800x400?text=No+Image'}
                alt={toilet.title}
                sx={{ objectFit: 'cover' }}
              />
              {toilet.images?.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, p: 2, overflowX: 'auto' }}>
                  {toilet.images.slice(1).map((img, idx) => (
                    <CardMedia
                      key={idx}
                      component="img"
                      sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }}
                      image={img.url}
                      alt={`${toilet.title} ${idx + 2}`}
                    />
                  ))}
                </Box>
              )}
            </Card>
          </Grid>

          <Grid>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {toilet.title}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
              >
                <LocationOnIcon sx={{ mr: 1 }} />
                {toilet.location}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip
                  label={toilet.isPaid ? `₹${toilet.price || 0}` : 'Free'}
                  color={toilet.isPaid ? 'default' : 'success'}
                />
                <Chip label={toilet.genderAccess} />
                {toilet.isAccessible && <Chip label="♿ Wheelchair Accessible" />}
                {toilet.hasSanitaryPadDisposal && <Chip label="🩸 Sanitary Facilities" />}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {toilet.description || 'No description provided'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography variant="h6">
                    {toilet.isPaid ? `₹${toilet.price || 0}` : 'Free'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Gender Access
                  </Typography>
                  <Typography variant="h6">{toilet.genderAccess}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Wheelchair Accessible
                  </Typography>
                  <Typography variant="h6">{toilet.isAccessible ? 'Yes' : 'No'}</Typography>
                </Grid>
                {toilet.cleanlinessRating && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Cleanliness Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={toilet.cleanlinessRating} readOnly size="small" />
                      <Typography variant="body1">{toilet.cleanlinessRating}/5</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {(user?.isAdmin || isOwner) && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    component={Link}
                    to={`/toilets/${id}/edit`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                  {user?.isAdmin && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<RemoveCircleOutlineIcon />}
                      onClick={handleReject}
                    >
                      Reject
                    </Button>
                  )}
                  {user.isAdmin && !toilet.isApproved && (
                    <Chip
                      label="Pending Approval"
                      color="warning"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        {/* Right Column - Reviews */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              Reviews ({toilet.reviewCount || 0})
            </Typography>

            {toilet.averageRating > 0 && (
              <Box sx={{ textAlign: 'center', my: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {toilet.averageRating.toFixed(1)}
                </Typography>
                <Rating value={toilet.averageRating} readOnly precision={0.1} size="large" />
                <Typography variant="body2" color="text.secondary">
                  Based on {toilet.reviewCount} review{toilet.reviewCount !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            {isAuthenticated && !userHasReviewed && (
              <Button
                variant="contained"
                fullWidth
                onClick={() => setReviewDialogOpen(true)}
                sx={{ mb: 3 }}
              >
                Add Review
              </Button>
            )}

            {isAuthenticated && userHasReviewed && (
              <Alert severity="info" sx={{ mb: 3 }}>
                You have already reviewed this toilet
              </Alert>
            )}

            {!isAuthenticated && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Please <Link to="/login">login</Link> to add a review
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {toilet.reviews && toilet.reviews.length > 0 ? (
              <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                {toilet.reviews.map((review) => (
                  <Box key={review._id} sx={{ mb: 3, pb: 3, borderBottom: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {review.author?.username || 'Anonymous'}
                      </Typography>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {review.body}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(review.datePosted).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No reviews yet. Be the first to review! 🌟
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Your Review</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Rating</Typography>
            <Rating
              value={reviewForm.rating}
              onChange={(e, newValue) => setReviewForm({ ...reviewForm, rating: newValue })}
              size="large"
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Review"
              value={reviewForm.body}
              onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
              sx={{ mt: 3 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleReviewSubmit}
            disabled={submittingReview || !reviewForm.body}
          >
            {submittingReview ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ToiletDetail;
