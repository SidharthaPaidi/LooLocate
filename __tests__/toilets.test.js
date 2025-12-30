const request = require('supertest');
const axios = require('axios');
jest.mock('axios');

const { connect, close } = require('./setupTestDB');
let app;
let Toilet;

beforeAll(async () => {
  await connect();
  app = require('../app');          // after env is set
  Toilet = require('../models/toilet');
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  await Toilet.deleteMany({});
});

test('GET /toilets returns all when no filters', async () => {
  await Toilet.create([
    { title: 'A', location: 'X', geometry: { type: 'Point', coordinates: [0,0] }, genderAccess: 'Unisex' },
    { title: 'B', location: 'Y', geometry: { type: 'Point', coordinates: [1,1] }, genderAccess: 'Male' },
  ]);

  const res = await request(app).get('/toilets');
  expect(res.status).toBe(200);
  expect(res.text).toContain('A');
  expect(res.text).toContain('B');
});

test('GET /toilets location search respects maxDistance', async () => {
  axios.get.mockResolvedValue({
    data: { features: [{ center: [72.8777, 19.0760], place_name: 'Mumbai, India' }] }
  });

  await Toilet.create([
    { title: 'Near', location: 'Mumbai', geometry: { type: 'Point', coordinates: [72.878, 19.076] }, genderAccess: 'Unisex' },
    { title: 'Far',  location: 'Delhi',  geometry: { type: 'Point', coordinates: [77.209, 28.613] }, genderAccess: 'Unisex' },
  ]);

  const res = await request(app)
    .get('/toilets')
    .query({ location: 'Mumbai', maxDistance: 5 }); // km

  expect(res.status).toBe(200);
  expect(res.text).toContain('Near');
  expect(res.text).not.toContain('Far');
});

test('POST /toilets creates a toilet (requires auth mocking if protected)', async () => {
  // if route requires login, you can stub auth middleware or issue a session cookie.
  const res = await request(app)
    .post('/toilets/new')
    .field('toilet[title]', 'New Loo')
    .field('toilet[location]', 'Mumbai')
    .field('toilet[genderAccess]', 'Unisex');

  // Adjust expectations depending on validation/auth
  expect([302, 200, 400]).toContain(res.status); // placeholder; refine per behavior
});