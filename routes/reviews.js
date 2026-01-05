// routes/reviews.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for nested routes
const Review = require('../models/review');
const Toilet = require('../models/toilet');
const { isLoggedIn } = require('../middleware');

// POST - Create new review
router.post('/', isLoggedIn, async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ success: false, message: 'Toilet not found' });
        }

        // Check if user already reviewed this toilet
        const existingReview = await Review.findOne({ 
            author: req.user._id, 
            toilet: toilet._id 
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this toilet' });
        }

        const review = new Review({
            body: req.body.review.body,
            rating: parseInt(req.body.review.rating),
            author: req.user._id,
            toilet: toilet._id
        });

        await review.save();
        toilet.reviews.push(review);
        await toilet.save();
        
        // Recalculate average rating
        await toilet.calculateAverageRating();

        res.status(201).json({ success: true, message: 'Review added successfully!', review });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding review', error: err.message });
    }
});

// PUT - Update existing review
router.put('/:reviewId', isLoggedIn, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if user owns this review
        if (!review.author.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: 'You can only edit your own reviews' });
        }

        review.body = req.body.review.body;
        review.rating = parseInt(req.body.review.rating);
        await review.save();

        // Recalculate average rating
        const toilet = await Toilet.findById(req.params.id);
        await toilet.calculateAverageRating();

        res.json({ success: true, message: 'Review updated successfully!', review });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating review', error: err.message });
    }
});

// DELETE - Remove review
router.delete('/:reviewId', isLoggedIn, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if user owns this review
        if (!review.author.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
        }

        await Review.findByIdAndDelete(req.params.reviewId);
        
        // Remove review from toilet's reviews array
        await Toilet.findByIdAndUpdate(req.params.id, {
            $pull: { reviews: req.params.reviewId }
        });

        // Recalculate average rating
        const toilet = await Toilet.findById(req.params.id);
        await toilet.calculateAverageRating();

        res.json({ success: true, message: 'Review deleted successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting review', error: err.message });
    }
});

module.exports = router;
