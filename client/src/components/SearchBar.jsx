import { Box, TextField, MenuItem, InputAdornment, Button } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StraightenIcon from "@mui/icons-material/Straighten";
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useState } from "react";
import {useAuth} from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

export default function SearchBar({ onSearch, initialValues = {} }) {
    const {user, logout, isAuthenticated} = useAuth();
    const navigate = useNavigate();
    const [location, setLocation] = useState(initialValues.location || '');
    const [paid, setPaid] = useState(initialValues.paid || '');
    const [maxDistance, setMaxDistance] = useState(initialValues.maxDistance || '1');

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
                            setLocation(newLocation);
                            // Trigger search with new location
                            onSearch({ location: newLocation, paid, maxDistance });
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

    const handleSearch = () => {
        // Pass all filter values to parent
        onSearch({ location, paid, maxDistance });
    };

    return (
        <Box
            sx={{
                display: "flex",
                backgroundColor: "#febb02",
                borderRadius: "8px",
                overflow: "hidden",
                width: "100%",
                maxWidth: "1100px",
                justifyContent: "center",
                alignItems: "center",
                padding: "2px",
                margin: "0 auto",
            }}
        >
            {/* Location */}
            <TextField
                placeholder="Find nearby toilets"
                fullWidth
                variant="outlined"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <LocationOnIcon />
                                <Button sx={{ padding: "4px 8px", fontSize: "12px" }} onClick={isAuthenticated ? handleLocationClick : () => navigate('/login')}>
                                    Use My Location
                                </Button>
                            </InputAdornment>
                        ),
                    }
                }}
                sx={{ backgroundColor: "#fff", borderRadius: "8px", margin: "2px" }}
            />

            {/* Range */}
            <TextField
                select
                variant="outlined"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                sx={{ backgroundColor: "#fff", minWidth: 180, borderRadius: "8px", margin: "2px" }}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <StraightenIcon />
                            </InputAdornment>
                        ),
                    }
                }}
            >
                <MenuItem value="0.5">Within 500 m</MenuItem>
                <MenuItem value="1">Within 1 km</MenuItem>
                <MenuItem value="2">Within 2 km</MenuItem>
                <MenuItem value="5">Within 5 km</MenuItem>
            </TextField>

            {/* Paid / Free */}
            <TextField
                select
                variant="outlined"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                sx={{ backgroundColor: "#fff", minWidth: 180, borderRadius: "8px", margin: "2px" }}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                               <CurrencyRupeeIcon />
                            </InputAdornment>
                        ),
                    },
                    select: {
                        displayEmpty: true,
                    }
                }}
            >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="false">Free only</MenuItem>
                <MenuItem value="true">Paid only</MenuItem>
            </TextField>

            <Button
                variant="contained"
                onClick={handleSearch}
                sx={{
                    backgroundColor: "primary.main",
                    paddingX: "32px",
                    fontSize: "18px",
                    borderRadius: 1,
                    margin: "2px",
                    "&:hover": {
                        backgroundColor: "#005fa3"
                    }
                }}
            >
                Search
            </Button>
        </Box>
    );
}