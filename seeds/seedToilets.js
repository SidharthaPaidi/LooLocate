require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const Toilet = require('../models/toilet');
const Review = require('../models/review');
const User = require('../models/user');

async function seedDB() {
  await mongoose.connect(process.env.MONGO_URL);

  console.log('✅ Connected to MongoDB Atlas');

  await Toilet.deleteMany({});
  await Review.deleteMany({});
  await User.deleteMany({});

  console.log('🧹 Database cleared');

  // USERS
  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = new User({
      username: faker.internet.username(),
      email: faker.internet.email()
    });

    await User.register(user, 'password123');
    users.push(user);
  }

  console.log('👤 Users created');

  // TOILETS + REVIEWS
  for (let i = 0; i < 50; i++) {
    const lat = faker.location.latitude({ min: 8, max: 37 });
    const lng = faker.location.longitude({ min: 68, max: 97 });

    const toilet = new Toilet({
      title: `${faker.word.adjective()} Toilet`,
      location: faker.location.streetAddress(),
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      genderAccess: faker.helpers.arrayElement(['Male', 'Female', 'Unisex']),
      author: faker.helpers.arrayElement(users)._id,
      status: 'Approved'
    });

    await toilet.save();

    const reviewCount = faker.number.int({ min: 0, max: 5 });
    const reviewers = faker.helpers.shuffle(users).slice(0, reviewCount);

    for (const reviewer of reviewers) {
      const review = new Review({
        body: faker.lorem.sentence(),
        rating: faker.number.int({ min: 1, max: 5 }),
        author: reviewer._id,
        toilet: toilet._id
      });

      await review.save();
      toilet.reviews.push(review._id);
    }

    await toilet.calculateAverageRating();
  }

  console.log('🚽 50 toilets created with reviews');
  await mongoose.connection.close();
}

seedDB().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
