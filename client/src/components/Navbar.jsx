import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container } from '@mui/system';
import Stack from '@mui/material/Stack';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    handleMenuClose();
  };

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main', boxShadow: 'none' }}>
      <Container maxWidth="lg">

        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              component={Link}
              to="/"
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'white',
                textDecoration: 'none',
                '&:hover': { opacity: 0.9 },
              }}
            >
              LooLocate
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              component={Link}
              to="/toilets"
              sx={{ color: 'white', fontWeight: 600 }}
            >
              Browse Toilets
            </Button>
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <Button component={Link} to="/admin" sx={{ color: 'white', fontWeight: 600 }}>
                    Admin Panel
                  </Button>
                )}
                <Button
                  component={Link}
                  to="/toilets/new"
                  sx={{ color: 'white', fontWeight: 600 }}
                >
                  Add Toilet
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    onClick={handleMenuOpen}
                    sx={{
                      bgcolor: 'primary.light',
                      cursor: 'pointer',
                      width: 36,
                      height: 36,
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem disabled>
                      <Typography variant="body2">{user?.username}</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </Box>
              </>
            ) : (
              <>
                <Stack spacing={2} direction="row">
                  <Button
                    component={Link}
                    to="/login"
                    sx={{ bgcolor: 'white', color: 'primary.main', fontSize: "14px", '&:hover': { opacity: 0.9 }, borderRadius: "4px", p: "8px" }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': { opacity: 0.9 },
                      borderRadius: "4px",
                      fontSize: "14px",
                      p: "8px",
                    }}
                  >
                    Register
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
