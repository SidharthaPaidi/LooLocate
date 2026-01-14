// routes/toilets.js
const express = require('express');
const router = express.Router();
const Toilet = require('../models/toilet');
const User = require('../models/user');
const { Types } = require('mongoose');
const { isLoggedIn, isAuthor, isAdmin } = require('../middleware');
const axios = require('axios');
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });

// GET admin dashboard with all toilets grouped by status
router.get('/admin', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const allToilets = await Toilet.find({}).populate('author');
    
    // console.log(`Admin: Found ${allToilets.length} total toilets`);
    
    // Update toilets without status to 'Pending'
    const updateResult = await Toilet.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'Pending' } }
    );
    
    if (updateResult.modifiedCount > 0) {
      // console.log(`Admin: Updated ${updateResult.modifiedCount} toilets to Pending status`);
    }
    
    // Re-fetch after update
    const updatedToilets = await Toilet.find({}).populate('author');
    
    const pending = updatedToilets.filter(t => !t.status || t.status === 'Pending' || t.status === 'pending');
    const approved = updatedToilets.filter(t => t.status === 'Approved' || t.status === 'approved');
    const rejected = updatedToilets.filter(t => t.status === 'Rejected' || t.status === 'rejected');

    // console.log(`Admin: Pending: ${pending.length}, Approved: ${approved.length}, Rejected: ${rejected.length}`);

    res.json({
      success: true,
      data: {
        pending: pending || [],
        approved: approved || [],
        rejected: rejected || [],
        counts: {
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          total: updatedToilets.length
        }
      }
    });
  } catch (err) {
    console.error('Error in admin route:', err);
    res.status(500).json({
      success: false,
      message: 'Error loading admin panel',
      error: err.message
    });
  }
});

// POST approve a toilet
router.post('/:id/approve', isLoggedIn, isAdmin, async (req, res) => {
  try {
    // console.log('Approve route hit:', req.params.id);
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      // console.log('Invalid toilet ID:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid toilet ID'
      });
    }
    
    const toilet = await Toilet.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });
    
    if (!toilet) {
      // console.log('Toilet not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }
    
    // // console.log('Toilet approved:', toilet.title);
    res.json({
      success: true,
      message: `Toilet "${toilet.title}" has been approved and is now visible on the dashboard.`,
      data: { toilet }
    });
  } catch (err) {
    console.error('Error approving toilet:', err);
    res.status(500).json({
      success: false,
      message: 'Error approving toilet',
      error: err.message
    });
  }
});

// POST reject a toilet
router.post('/:id/reject', isLoggedIn, isAdmin, async (req, res) => {
  try {
    // console.log('Reject route hit:', req.params.id);
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      // console.log('Invalid toilet ID:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid toilet ID'
      });
    }
    
    const toilet = await Toilet.findByIdAndUpdate(id, { status: 'Rejected' }, { new: true });
    
    if (!toilet) {
      // console.log('Toilet not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }
    
    // console.log('Toilet rejected:', toilet.title);
    res.json({
      success: true,
      message: `Toilet "${toilet.title}" has been rejected and will not be shown on the dashboard.`,
      data: { toilet }
    });
  } catch (err) {
    console.error('Error rejecting toilet:', err);
    res.status(500).json({
      success: false,
      message: 'Error rejecting toilet',
      error: err.message
    });
  }
});


// GET all toilets with filters
router.get('/', async (req, res) => {
  try {
    const { paid, minRating, location, maxDistance } = req.query;
    let filter = {};

    // Apply paid filter
    if (paid === "true") filter.isPaid = true;
    if (paid === "false") filter.isPaid = false;

    // Apply rating filter
    if (minRating && !isNaN(minRating)) {
      filter.cleanlinessRating = { $gte: parseInt(minRating) };
    }

    const searchRadius = (maxDistance && !isNaN(maxDistance) && maxDistance > 0)
      ? parseFloat(maxDistance) * 1000
      : 100000; // Default 100km in meters

    let toilets = [];
    let searchedCity = null;
    let message = null;

    // Only show approved toilets on dashboard
    filter.status = 'Approved';

    // Location-based search
    if (location && location.trim() !== '') {
      try {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=IN&proximity=79.0882,21.1458&limit=1&access_token=${process.env.MAPBOX_TOKEN}`;

        const geoResponse = await axios.get(geocodeUrl);

        if (geoResponse.data.features && geoResponse.data.features.length > 0) {
          const cityCenter = geoResponse.data.features[0].center; // [lng, lat]
          const cityName = geoResponse.data.features[0].place_name;

          searchedCity = cityName.split(',')[0];

          let geoQuery = {
            geometry: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [cityCenter[0], cityCenter[1]]
                },
                $maxDistance: searchRadius
              }
            }
          };

          Object.assign(geoQuery, filter);
          toilets = await Toilet.find(geoQuery).populate('author');
          const distanceKm = (searchRadius / 1000).toFixed(1);

          if (toilets.length > 0) {
            message = `Found ${toilets.length} toilet${toilets.length > 1 ? 's' : ''} in ${searchedCity}`;
          } else {
            message = `No toilets found within ${distanceKm} km of ${searchedCity}. Try a broader search or add the first toilet in this area.`;
          }
        } else {
          message = 'Location not found. Please try a different search term.';
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        return res.status(400).json({
          success: false,
          message: 'Could not search for that location. Please try again.'
        });
      }
    } else {
      // If no location search, just apply other filters
      toilets = await Toilet.find(filter).populate('author');
    }

    res.json({
      success: true,
      data: {
        toilets,
        count: toilets.length,
        filters: {
          paid,
          minRating,
          location,
          maxDistance: maxDistance || 100
        },
        searchedCity,
        message
      }
    });
  } catch (err) {
    console.error('Error fetching toilets:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching toilets',
      error: err.message
    });
  }
});

// GET new toilet form (returns form template info or redirect to frontend)
router.get('/new', isLoggedIn, (req, res) => {
  res.json({
    success: true,
    message: 'Toilet creation form',
    data: {
      fields: ['title', 'location', 'isPaid', 'description', 'images']
    }
  });
  console.log("New toilet form");
});

// POST create new toilet
router.post('/new', isLoggedIn, upload.array('image'), async (req, res) => {
  try {
    console.log("Incoming toilet data:", req.body);

    if (!req.body.toilet || !req.body.toilet.location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const address = req.body.toilet.location;
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_TOKEN}`;

    const geoResponse = await axios.get(geocodeUrl);

    if (!geoResponse.data.features || geoResponse.data.features.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not find location. Please enter a more specific address.'
      });
    }

    const coordinates = geoResponse.data.features[0].center; // [lng, lat]

    const toilet = new Toilet(req.body.toilet);

    toilet.geometry = {
      type: "Point",
      coordinates: coordinates
    };

    toilet.author = req.user._id;
    toilet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await toilet.save();
    
    console.log("Toilet created:", toilet);
    
    res.status(201).json({
      success: true,
      message: 'Toilet added successfully!',
      data: { 
        toiletId: toilet._id,
        toilet 
      }
    });
  } catch (err) {
    console.error("Error creating toilet:", err);
    res.status(500).json({
      success: false,
      message: 'Error creating toilet. Please try again.',
      error: err.message
    });
  }
});

// GET single toilet details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid toilet ID'
      });
    }

    const toilet = await Toilet.findById(id)
      .populate('author')
      .populate({
        path: 'reviews',
        populate: {
          path: 'author'
        }
      });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    res.json({
      success: true,
      isAdmin: req.user && req.user.isAdmin,
      data: { toilet }
    });
  } catch (err) {
    console.error('Error fetching toilet:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching toilet',
      error: err.message
    });
  }
});

// GET edit form for toilet
router.get('/:id/edit', isLoggedIn, isAuthor, async (req, res) => {
  try {
    const toilet = await Toilet.findById(req.params.id);
    
    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    res.json({
      success: true,
      data: { toilet }
    });
  } catch (err) {
    console.error('Error fetching toilet:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching toilet',
      error: err.message
    });
  }
});

// PUT update toilet
router.put('/:id', isLoggedIn, isAuthor, upload.array('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid toilet ID!'
      });
    }

    if (!req.body.toilet || !req.body.toilet.location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    // Geocode new address
    const address = req.body.toilet.location;
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_TOKEN}`;
    const geoResponse = await axios.get(geocodeUrl);

    if (!geoResponse.data.features || geoResponse.data.features.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not find location. Please enter a more specific address.'
      });
    }

    const coordinates = geoResponse.data.features[0].center; // [lng, lat]

    // Find toilet
    const toilet = await Toilet.findById(id);
    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found!'
      });
    }

    // Update fields
    toilet.set({
      ...req.body.toilet,
      geometry: { type: "Point", coordinates }
    });

    // Delete selected images
    if (req.body.deleteImages) {
      const deleteImages = Array.isArray(req.body.deleteImages) 
        ? req.body.deleteImages 
        : [req.body.deleteImages];
      
      for (let filename of deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      toilet.images = toilet.images.filter(img => !deleteImages.includes(img.filename));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const images = req.files.map(f => ({ url: f.path, filename: f.filename }));
      toilet.images.push(...images);
    }

    await toilet.save();
    
    res.json({
      success: true,
      message: 'Successfully updated toilet',
      data: { toilet }
    });
  } catch (err) {
    console.error("Error updating toilet:", err);
    res.status(500).json({
      success: false,
      message: 'Error updating toilet',
      error: err.message
    });
  }
});

// DELETE toilet
router.delete('/:id', isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid toilet ID!'
      });
    }

    const toilet = await Toilet.findByIdAndDelete(id);
    
    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully deleted toilet',
      data: { deletedToiletId: id }
    });
  } catch (err) {
    console.error("Error deleting toilet:", err);
    res.status(500).json({
      success: false,
      message: 'Error deleting toilet',
      error: err.message
    });
  }
});

module.exports = router;