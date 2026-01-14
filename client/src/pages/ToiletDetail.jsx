import { useState, useEffect, useRef, useCallback } from 'react';
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
import Footer from '../components/Footer';
import Map from '../components/Map';

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
  const [actionDialog, setActionDialog] = useState({ open: false, toilet: null, action: '' });

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

  const handleAction = async (toiletId, action) => {
    try {
      if (action === 'delete') {
        await toiletsAPI.delete(toiletId);
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
    <>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/toilets')}
        sx={{ mt: 2, ml: 20 }}
      >
        Back to List
      </Button>

      <Container maxWidth="lg" sx={{ p: 3, mt: -5, display: 'flex', justifyContent: 'space-evenly' }}>
        <Grid size="5" sx={{ p: 1, mt: -5 }}>
          <Card sx={{ mb: 3, maxWidth: 500, mt: 7 }}>
            <CardMedia
              component="img"
              image={toilet.images?.[0]?.url || 'https://www.freepik.com/premium-vector/image-available-icon-set-default-missing-photo-stock-vector-symbol-black-filled-outlined-style-no-image-found-sign_306720864.htm'}
              alt={toilet.title}
              sx={{ objectFit: 'cover', height: 300 }}
            />
            {toilet.images?.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                {toilet.images.slice(1).map((img, idx) => (
                  <CardMedia
                    key={idx}
                    component="img"
                    image={img.url}
                    alt={`${toilet.title} ${idx + 2}`}
                    sx={{ width: 100, height: 80, objectFit: 'cover' }}
                  />
                ))}
              </Box>
            )}
          </Card>
          <Paper sx={{ p: 3, top: 80 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, textDecoration: 'underline' }}>
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
              <Button variant="contained" fullWidth onClick={() => setReviewDialogOpen(true)}
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
                Please
                <Link to="/login"> login</Link> to add a review
              </Alert>
            )}
          </Paper>
        </Grid>
        <Grid sx={{ p: 3, borderRadius: 2, size: "7" }}>
          <Paper sx={{ p: 4 }}>
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
              {toilet.location}                </Typography>

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
                  onClick={() => openActionDialog(toilet, 'delete')}
                >
                  Delete
                </Button>
                {user?.isAdmin && toilet.status === 'Approved' && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveCircleOutlineIcon />}
                    onClick={() => {
                      openActionDialog(toilet, 'reject')
                      navigate('/admin');
                    } }
                  >
                    Reject
                  </Button>
                )}
              </Box>
            )}
          </Paper>
          <Paper sx={{ mt: 2 }}>
            {toilet.reviews && toilet.reviews.length > 0 ? (
              <Box sx={{ maxHeight: '500px', overflowY: 'auto', p: 3 }}>
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
          <Grid>
            <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Add Your Review</DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <Typography gutterBottom>Rating</Typography>
                  <Rating value={reviewForm.rating} onChange={(e, newValue) => setReviewForm({ ...reviewForm, rating: newValue })}
                    size="large"
                  />
                  <TextField fullWidth multiline rows={4} label="Review" value={reviewForm.body} onChange={(e) => setReviewForm({
                    ...reviewForm, body: e.target.value
                  })}
                    sx={{ mt: 3 }}
                    required
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleReviewSubmit} disabled={submittingReview || !reviewForm.body}>
                  {submittingReview ? 'Submitting...' : 'Submit'}
                </Button>
              </DialogActions>
            </Dialog>
          </Grid>
        </Grid>
      </Container>
      <Container maxWidth="lg" sx={{ p: 3, mt: -5 }}>
        <Map type="detail" toilet={toilet} />
      </Container>
      <Footer />

      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, toilet: null, action: '' })}>
        <DialogTitle>
          {actionDialog.action === 'delete' ? 'Delete' : 'Reject'} Toilet
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
            color={actionDialog.action === 'delete' ? 'error' : 'error'}
            onClick={() => handleAction(actionDialog.toilet?._id, actionDialog.action)}
          >
            {actionDialog.action === 'delete' ? 'delete' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ToiletDetail;
