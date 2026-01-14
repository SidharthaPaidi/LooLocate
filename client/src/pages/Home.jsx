import {
  Box,
  TextField,
  MenuItem, Container, Typography, Button, Grid, Card, CardContent, CardActions, Paper, InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WcIcon from '@mui/icons-material/Wc';
import SearchBar from '../components/SearchBar';
import { useEffect, useRef, useState } from 'react';
import Map from '../components/Map';
import Brightness1Icon from '@mui/icons-material/Brightness1';
import StarIcon from '@mui/icons-material/Star';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AccessibleIcon from '@mui/icons-material/Accessible';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';


const bull = (
  <Brightness1Icon sx={{ fontSize: 8, mx: 0.5, verticalAlign: 'middle' }} />
);

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowFloatingSearch(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featureCards = [
    {
      title: 'Toilets Near You',
      subtitle: 'Instant Access',
      description: 'Find clean restrooms within walking distance using your location.',
      action: 'View Nearby',
      icon: <WcIcon />,
    },
    {
      title: 'Cleanliness Ratings',
      subtitle: 'Community Trusted',
      description: 'Ratings and reviews by real users for hygiene and safety.',
      action: 'See Ratings',
      icon: <StarIcon />,
    },
    {
      title: 'Free & Paid Toilets',
      subtitle: 'Cost Transparency',
      description: 'Filter restrooms by free or low-cost options nearby.',
      action: 'Filter Free',
      icon: <CurrencyRupeeIcon />,
    },
    {
      title: 'Accessible Toilets',
      subtitle: 'Inclusive Design',
      description: 'Male, Female, Unisex & accessible restrooms supported.',
      action: 'Explore Access',
      icon: <AccessibleIcon />,
    },
  ];

  return (
    <>
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
          elevation: 4,
          transform: showFloatingSearch ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Box sx={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
          <SearchBar onSearch={(filters) => {
            const queryParams = new URLSearchParams();
            if (filters.location) queryParams.append('location', filters.location);
            if (filters.paid) queryParams.append('paid', filters.paid);
            if (filters.maxDistance) queryParams.append('maxDistance', filters.maxDistance);
            // navigate(`/toilets?${queryParams.toString()}`);
          }} />
        </Box>
      </Box>

      <Container>
        <Box sx={{
          minHeight: '44vh',
          bgcolor: 'primary.main',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1,
        }}>
          <WcIcon sx={{ fontSize: 200, color: 'primary.light', opacity: 0.1, position: 'absolute', top: '20%', left: '10%' }} />
          <LocationOnIcon sx={{ fontSize: 200, color: 'primary.light', opacity: 0.1, position: 'absolute', top: '40%', left: '70%' }} />
          <Typography variant='h1' component="div" sx={{ fontSize: '50px', color: 'white', pt: 10, top: '35%', right: '50%', position: 'absolute', }}>
            Find nearby restrooms
            <Typography variant='h5' component="div" sx={{ fontWeight: 'normal', mt: 1, color: 'white', maxWidth: 600 }}>
              Discover clean and accessible restrooms around you with ease.
            </Typography>
          </Typography>
          <Box
            sx={{
              backgroundColor: "#003580",
              padding: "16px",
              display: "flex",
              justifyContent: "center"
            }}
          >
          </Box>

        </Box>
        <Box sx={{ transform: "translateY(260px)", width: '100%', maxWidth: 1000, px: 2, mx: 'auto' }}>
          <SearchBar onSearch={(filters) => {
            const queryParams = new URLSearchParams();
            if (filters.location) queryParams.append('location', filters.location);
            if (filters.paid) queryParams.append('paid', filters.paid);
            if (filters.maxDistance) queryParams.append('maxDistance', filters.maxDistance);
            // navigate(`/toilets?${queryParams.toString()}`);
          }} />
        </Box>
        <Box sx={{ mt: 40, mb: 5 }}>
          <Grid
            container
            spacing={3}
            sx={{ mt: 5, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              {featureCards.map((card, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Card
                    sx={{
                      height: '100%',
                      width: '90%',
                      borderRadius: 3,
                      boxShadow: 2,
                      transition: '0.3s',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Typography sx={{ fontSize: 32, mb: 1 }}>
                        {card.icon}
                      </Typography>

                      <Typography
                        gutterBottom
                        sx={{ color: 'text.secondary', fontSize: 13 }}
                      >
                        {card.subtitle}
                      </Typography>

                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {card.title}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        {card.description}
                      </Typography>
                    </CardContent>

                    <CardActions>
                      <Button onClick={() => navigate('/toilets')} size="small">{card.action}</Button>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Grid>
          </Grid>
        </Box>

        <Box sx={{
          borderRadius: 2, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          elevation: 15
        }}>
          <Map />
        </Box>


      </Container>

      <Footer />

    </>
  );
};

export default Home;
