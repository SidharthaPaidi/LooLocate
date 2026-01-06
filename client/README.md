# Where Is My Loo - Frontend

React frontend for the Where Is My Loo application, built with Vite, Material UI, and React Router.

## Features

- 🔍 Search and filter toilets by location, price, rating, and distance
- 📝 Add, edit, and delete toilet listings
- ⭐ Review system with ratings
- 👤 User authentication (JWT-based)
- 🛠️ Admin panel for approving/rejecting toilets
- 📱 Responsive design with Booking.com-inspired theme

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the client directory:
```
VITE_API_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3001`

## Build

To build for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Tech Stack

- React 19
- Vite
- Material UI (MUI)
- React Router
- Axios
- React Hook Form

## Project Structure

```
src/
  ├── components/     # Reusable components (Navbar, etc.)
  ├── pages/          # Page components
  ├── services/       # API services
  ├── context/        # React context (Auth)
  ├── theme.js        # Material UI theme configuration
  └── App.jsx         # Main app component with routing
```