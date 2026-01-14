import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box } from '@mui/system';
import { toiletsAPI } from '../services/api';

const Map = ({ type, toilet }) => {
    const mapContainerRef = useRef();
    const mapRef = useRef();
    const [toilets, setToilets] = useState([]);

    // Fetch toilets data (only for non-detail type)
    useEffect(() => {
        if (type === 'detail') return; // Skip fetching for detail view
        
        const fetchToilets = async () => {
            try {   
                const response = await toiletsAPI.getAll();
                // console.log('API Response:', response.data);
                // API returns { success: true, data: { toilets: [...] } }
                const toiletData = response.data?.data?.toilets || response.data?.toilets || response.data || [];
                // console.log('Toilets data:', toiletData);
                setToilets(toiletData);
            } catch (error) {
                console.error('Error fetching toilets:', error);
            }
        };
        fetchToilets();
    }, [type]);

    // Initialize map for detail view (single toilet)
    useEffect(() => {
        if (type !== 'detail') return;
        if (!toilet?.geometry?.coordinates) return;
        if (!mapContainerRef.current) return;
        
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

        const [lng, lat] = toilet.geometry.coordinates;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 5
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl());

        // Add marker for the toilet
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${toilet.title}</h3>
                <p style="margin: 4px 0; font-size: 14px;">📍 ${toilet.location}</p>
            </div>`
        );

        new mapboxgl.Marker({ color: '#1976d2' })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(mapRef.current);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [type, toilet]);

    // Initialize map for list view (all toilets with clustering)
    useEffect(() => {
        if (type === 'detail') return;
        if (mapRef.current) return; // initialize map only once
        if (!mapContainerRef.current) return;
        
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [78.9629, 20.5937], // Center on India
            zoom: 5
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl());

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [type]);

    // Add toilets data to map when toilets are fetched (list view only)
    useEffect(() => {
        if (type === 'detail') return;
        if (!mapRef.current) {
            return;
        }
        
        if (!Array.isArray(toilets) || toilets.length === 0) {
            console.log('No toilets to display');
            return;
        }

        const addToiletsLayer = () => {
            console.log('Adding toilets layer...');
            
            // Filter out toilets without valid geometry
            const validToilets = toilets.filter(toilet => 
                toilet.geometry && 
                toilet.geometry.coordinates && 
                toilet.geometry.coordinates.length === 2
            );
            
            console.log('Valid toilets with geometry:', validToilets.length);
            
            if (validToilets.length === 0) {
                return;
            }
            
            // Convert toilets to GeoJSON format
            const geojsonData = {
                type: 'FeatureCollection',
                features: validToilets.map(toilet => ({
                    type: 'Feature',
                    properties: {
                        id: toilet._id,
                        title: toilet.title,
                        location: toilet.location,
                        genderAccess: toilet.genderAccess,
                        isAccessible: toilet.isAccessible,
                        isPaid: toilet.isPaid,
                        price: toilet.price
                    },
                    geometry: toilet.geometry
                }))
            };

            // Remove existing source/layers if they exist
            if (mapRef.current.getSource('toilets')) {
                mapRef.current.removeLayer('toilet-clusters');
                mapRef.current.removeLayer('cluster-count');
                mapRef.current.removeLayer('unclustered-toilet');
                mapRef.current.removeSource('toilets');
            }

            mapRef.current.addSource('toilets', {
                type: 'geojson',
                data: geojsonData,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });

            mapRef.current.addLayer({
                id: 'toilet-clusters',
                type: 'circle',
                source: 'toilets',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#51bbd6',
                        10,
                        '#f1f075',
                        30,
                        '#f28cb1'
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,
                        10,
                        30,
                        30,
                        40
                    ]
                }
            });

            mapRef.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'toilets',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                }
            });

            mapRef.current.addLayer({
                id: 'unclustered-toilet',
                type: 'circle',
                source: 'toilets',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#11b4da',
                    'circle-radius': 8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });

            // Click on cluster to zoom in
            mapRef.current.on('click', 'toilet-clusters', (e) => {
                const features = mapRef.current.queryRenderedFeatures(e.point, {
                    layers: ['toilet-clusters']
                });
                const clusterId = features[0].properties.cluster_id;
                mapRef.current
                    .getSource('toilets')
                    .getClusterExpansionZoom(clusterId, (err, zoom) => {
                        if (err) return;
                        mapRef.current.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom
                        });
                    });
            });

            // Click on unclustered point to show popup
            mapRef.current.on('click', 'unclustered-toilet', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { title, location, genderAccess, isAccessible, isPaid, price, id } = e.features[0].properties;

                const popupContent = `
                    <div style="padding: 8px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px;">${title}</h3>
                        <p style="margin: 4px 0; font-size: 14px;">📍 ${location}</p>
                        <p style="margin: 4px 0; font-size: 14px;">🚻 ${genderAccess}</p>
                        <p style="margin: 4px 0; font-size: 14px;">♿ ${isAccessible ? 'Accessible' : 'Not Accessible'}</p>
                        <p style="margin: 4px 0; font-size: 14px;">💰 ${isPaid ? `₹${price || 'Paid'}` : 'Free'}</p>
                        <a href="/toilets/${id}" style="color: #1976d2; text-decoration: none;">View Details →</a>
                    </div>
                `;

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(mapRef.current);
            });

            // Change cursor on hover
            mapRef.current.on('mouseenter', 'toilet-clusters', () => {
                mapRef.current.getCanvas().style.cursor = 'pointer';
            });
            mapRef.current.on('mouseleave', 'toilet-clusters', () => {
                mapRef.current.getCanvas().style.cursor = '';
            });
            mapRef.current.on('mouseenter', 'unclustered-toilet', () => {
                mapRef.current.getCanvas().style.cursor = 'pointer';
            });
            mapRef.current.on('mouseleave', 'unclustered-toilet', () => {
                mapRef.current.getCanvas().style.cursor = '';
            });
        };

        // Wait for map to load before adding layers
        if (mapRef.current.loaded()) {
            addToiletsLayer();
        } else {
            mapRef.current.on('load', addToiletsLayer);
        }
    }, [toilets]);

    return (
        (type !== "detail" && <Box sx={{ 
        }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '50vh' }}></div>
        </Box>) ||

        (type === "detail" && <Box >
            <div ref={mapContainerRef} style={{ width: '100%', height: '400px', borderRadius: '8px' }}></div>
        </Box>)
    );
};

export default Map;