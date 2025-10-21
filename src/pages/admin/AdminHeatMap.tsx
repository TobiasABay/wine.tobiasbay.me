import { UserButton } from "@clerk/clerk-react"
import { Box, Typography, Paper, Alert, Switch, FormControlLabel } from "@mui/material"
import { useUser } from "@clerk/clerk-react"
import { useEffect, useRef, useState } from "react"
import { apiService } from "../../services/api"
import type { Event } from "../../services/api"

// Extend Window interface to include Google Maps types
declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

interface EventLocation {
    event: Event;
    lat: number;
    lng: number;
}

export default function AdminHeatMap() {
    const { user } = useUser();
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [heatmap, setHeatmap] = useState<any>(null);
    const [, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [events, setEvents] = useState<Event[]>([]);
    const [eventLocations, setEventLocations] = useState<EventLocation[]>([]);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showMarkers, setShowMarkers] = useState(true);
    const markersRef = useRef<any[]>([]);
    const scriptLoadingRef = useRef<boolean>(false);
    const scriptLoadedRef = useRef<boolean>(false);

    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // Load events from API
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const allEvents = await apiService.getAllEvents();
                setEvents(allEvents);
            } catch (err: any) {
                setError(`Failed to load events: ${err.message}`);
                setLoading(false);
            }
        };

        loadEvents();
    }, []);

    // Load Google Maps API dynamically
    useEffect(() => {
        if (!apiKey) return;

        const loadGoogleMaps = () => {
            // Check if already loaded
            if (scriptLoadedRef.current && window.google && window.google.maps) {
                console.log('Google Maps already loaded');
                return Promise.resolve();
            }

            // Check if currently loading
            if (scriptLoadingRef.current) {
                console.log('Google Maps currently loading, waiting...');
                return new Promise<void>((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (scriptLoadedRef.current && window.google && window.google.maps && window.google.maps.Geocoder) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            }

            // Check if script already exists in DOM
            const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existingScript) {
                console.log('Google Maps script found in DOM, waiting for load...');
                scriptLoadingRef.current = true;
                return new Promise<void>((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (window.google && window.google.maps && window.google.maps.Geocoder && window.google.maps.visualization) {
                            clearInterval(checkInterval);
                            scriptLoadedRef.current = true;
                            scriptLoadingRef.current = false;
                            console.log('Google Maps fully initialized from existing script');
                            resolve();
                        }
                    }, 1000);
                });
            }

            // Load the script
            scriptLoadingRef.current = true;
            return new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async`;
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    console.log('Google Maps script loaded');
                    // Wait for Google Maps to be fully initialized
                    const checkGoogleMapsReady = setInterval(() => {
                        if (window.google && window.google.maps && window.google.maps.Geocoder && window.google.maps.marker) {
                            clearInterval(checkGoogleMapsReady);
                            scriptLoadedRef.current = true;
                            scriptLoadingRef.current = false;
                            resolve();
                        }
                    }, 100);

                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkGoogleMapsReady);
                        scriptLoadingRef.current = false;
                        if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
                            reject(new Error('Google Maps initialization timeout'));
                        }
                    }, 10000);
                };
                script.onerror = () => {
                    scriptLoadingRef.current = false;
                    reject(new Error('Failed to load Google Maps'));
                };
                document.head.appendChild(script);
            });
        };

        loadGoogleMaps()
            .then(() => {
                console.log('Google Maps API ready to use');
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [apiKey]);

    // Geocode event locations and initialize map
    useEffect(() => {
        if (!window.google || !window.google.maps || !window.google.maps.Geocoder || events.length === 0 || !mapRef.current) {
            return;
        }

        const geocodeEvents = async () => {
            // Double-check Geocoder is available
            if (!window.google.maps.Geocoder) {
                setError('Google Maps Geocoder not available. Please refresh the page.');
                setLoading(false);
                return;
            }

            const geocoder = new window.google.maps.Geocoder();
            const locations: EventLocation[] = [];
            const failedEvents: string[] = [];

            const geocodePromises = events.map(async (event) => {
                try {
                    const result = await new Promise<any>((resolve, reject) => {
                        geocoder.geocode({ address: event.location }, (results: any, status: any) => {
                            if (status === 'OK' && results[0]) {
                                resolve(results[0]);
                            } else {
                                reject(new Error(`Geocoding failed: ${status}`));
                            }
                        });
                    });

                    const lat = result.geometry.location.lat();
                    const lng = result.geometry.location.lng();
                    locations.push({ event, lat, lng });
                } catch (err: any) {
                    // Only log if it's not a ZERO_RESULTS error (which is expected for invalid locations)
                    if (!err.message?.includes('ZERO_RESULTS')) {
                        console.error(`✗ Failed to geocode "${event.name}" (${event.location}):`, err);
                    }
                    failedEvents.push(`${event.name} (${event.location})`);
                }
            });

            await Promise.all(geocodePromises);
            setEventLocations(locations);

            // Initialize map
            if (locations.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                locations.forEach(loc => {
                    bounds.extend(new window.google.maps.LatLng(loc.lat, loc.lng));
                });

                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    zoom: 4,
                    center: bounds.getCenter(),
                    mapTypeId: 'roadmap',
                    mapId: 'DEMO_MAP_ID' // Required for AdvancedMarkerElement
                });

                mapInstance.fitBounds(bounds);
                setMap(mapInstance);

                // Create custom heatmap visualization using circles instead of deprecated HeatmapLayer
                const heatmapData = locations.map(loc => ({
                    position: new window.google.maps.LatLng(loc.lat, loc.lng),
                    weight: 1
                }));

                // Create custom heatmap using circles with gradient opacity
                const heatmapCircles = heatmapData.map((data) => {
                    const circle = new window.google.maps.Circle({
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.35,
                        map: mapInstance,
                        center: data.position,
                        radius: 50000, // 50km radius
                        zIndex: 1
                    });
                    return circle;
                });

                setHeatmap(heatmapCircles);

                // Create markers using modern AdvancedMarkerElement
                const markers = locations.map(loc => {
                    const marker = new window.google.maps.marker.AdvancedMarkerElement({
                        position: { lat: loc.lat, lng: loc.lng },
                        map: mapInstance,
                        title: loc.event.name
                    });

                    // Create info window
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; max-width: 300px;">
                                <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 16px;">${loc.event.name}</h3>
                                <p style="margin: 5px 0; color: #333;"><strong>Date:</strong> ${new Date(loc.event.date).toLocaleDateString()}</p>
                                <p style="margin: 5px 0; color: #333;"><strong>Location:</strong> ${loc.event.location}</p>
                                <p style="margin: 5px 0; color: #333;"><strong>Wine Type:</strong> ${loc.event.wine_type}</p>
                                <p style="margin: 5px 0; color: #333;"><strong>Participants:</strong> ${loc.event.players?.length || 0}/${loc.event.max_participants}</p>
                                <p style="margin: 5px 0; color: #333;"><strong>Status:</strong> ${loc.event.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
                            </div>
                        `
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(mapInstance, marker);
                    });

                    return marker;
                });

                markersRef.current = markers;
            } else if (events.length > 0) {
                // All geocoding failed - create a default map centered on world
                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    zoom: 2,
                    center: { lat: 20, lng: 0 },
                    mapTypeId: 'roadmap',
                    mapId: 'DEMO_MAP_ID' // Required for AdvancedMarkerElement
                });
                setMap(mapInstance);
            }

            setLoading(false);
        };

        geocodeEvents();
    }, [events, window.google]);

    // Toggle heatmap visibility
    useEffect(() => {
        if (heatmap && Array.isArray(heatmap)) {
            heatmap.forEach(circle => {
                circle.setMap(showHeatmap ? map : null);
            });
        }
    }, [showHeatmap, heatmap, map]);

    // Toggle markers visibility
    useEffect(() => {
        if (markersRef.current.length > 0) {
            markersRef.current.forEach(marker => {
                marker.setMap(showMarkers ? map : null);
            });
        }
    }, [showMarkers, map]);

    return (
        <>
            {/* Header with User Info */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Event Location Heat Map
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Admin'}
                    </Typography>
                </Box>
                <UserButton afterSignOutUrl="/" />
            </Box>

            {/* API Key Warning */}
            {!apiKey && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Missing Google Maps API Key. Please add <strong>VITE_GOOGLE_MAPS_API_KEY</strong> to your <code>.env.local</code> file.
                </Alert>
            )}

            {/* Stats */}
            {apiKey && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Paper sx={{ p: 2, flex: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Total Events
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                            {events.length}
                        </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Geocoded Locations
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            {eventLocations.length}
                        </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Active Events
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                            {events.filter(e => e.is_active).length}
                        </Typography>
                    </Paper>
                </Box>
            )}

            {/* Controls */}
            {apiKey && map && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showHeatmap}
                                    onChange={(e) => setShowHeatmap(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Show Heatmap"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showMarkers}
                                    onChange={(e) => setShowMarkers(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Show Markers"
                        />
                    </Box>
                </Paper>
            )}

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Map Container */}
            {apiKey && (
                <Paper sx={{ p: 0, overflow: 'hidden' }}>
                    <div
                        ref={mapRef}
                        style={{
                            width: '100%',
                            height: '600px',
                            borderRadius: '4px'
                        }}
                    />
                </Paper>
            )}

            {/* Instructions */}
            {!apiKey && (
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        How to get a Google Maps API Key:
                    </Typography>
                    <ol style={{ paddingLeft: '20px' }}>
                        <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                        <li>Create a new project or select an existing one</li>
                        <li>Enable the following APIs:
                            <ul>
                                <li>Maps JavaScript API</li>
                                <li>Geocoding API</li>
                            </ul>
                        </li>
                        <li>Create credentials (API Key)</li>
                        <li>Copy and paste the API key above</li>
                    </ol>
                </Paper>
            )}
        </>
    )
}
