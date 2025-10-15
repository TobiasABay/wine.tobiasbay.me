import { Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Badge } from '@mui/material';
import { Dashboard, EventNote, Home, Insights, Feedback, Wifi } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const drawerWidth = 240;

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [newFeedbackCount, setNewFeedbackCount] = useState(0);

    useEffect(() => {
        // Check for new feedback when the admin layout mounts
        checkNewFeedback();
    }, []);

    const checkNewFeedback = async () => {
        try {
            const response = await apiService.getAllFeedback();
            const totalFeedback = response.feedback?.length || 0;

            // Get last viewed count from localStorage
            const lastViewedCount = parseInt(localStorage.getItem('admin-last-viewed-feedback-count') || '0', 10);

            // Calculate new feedback count
            const newCount = Math.max(0, totalFeedback - lastViewedCount);
            setNewFeedbackCount(newCount);
        } catch (error) {
            console.error('Error checking new feedback:', error);
        }
    };

    const handleFeedbackClick = () => {
        navigate('/admin/feedback');

        // Mark feedback as viewed when navigating to the feedback page
        apiService.getAllFeedback().then(response => {
            const totalFeedback = response.feedback?.length || 0;
            localStorage.setItem('admin-last-viewed-feedback-count', totalFeedback.toString());
            setNewFeedbackCount(0);
        }).catch(error => {
            console.error('Error updating viewed feedback count:', error);
        });
    };

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Fixed Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: '#f5f5f5',
                        borderRight: '2px solid #e0e0e0'
                    },
                }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        Wine Tasting
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Admin Dashboard
                    </Typography>
                </Box>

                <List sx={{ pt: 2 }}>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/')} selected={location.pathname === '/'}>
                            <ListItemIcon>
                                <Home />
                            </ListItemIcon>
                            <ListItemText primary="Home" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/admin')} selected={location.pathname === '/admin'}>
                            <ListItemIcon>
                                <EventNote />
                            </ListItemIcon>
                            <ListItemText primary="All Events" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/admin/dashboard')} selected={location.pathname === '/admin/dashboard'}>
                            <ListItemIcon>
                                <Dashboard />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItemButton>
                    </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/admin/insights')} selected={location.pathname === '/admin/insights'}>
                            <ListItemIcon>
                                <Insights />
                            </ListItemIcon>
                            <ListItemText primary="Insights" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={handleFeedbackClick} selected={location.pathname === '/admin/feedback'}>
                            <ListItemIcon>
                                <Badge
                                    badgeContent={newFeedbackCount}
                                    color="error"
                                    overlap="circular"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            right: -3,
                                            top: 3,
                                            fontSize: '0.65rem',
                                            height: 18,
                                            minWidth: 18,
                                            padding: '0 4px'
                                        }
                                    }}
                                >
                                    <Feedback />
                                </Badge>
                            </ListItemIcon>
                            <ListItemText primary="Feedback" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/ws-test')}>
                            <ListItemIcon>
                                <Wifi />
                            </ListItemIcon>
                            <ListItemText primary="WebSocket" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>

            {/* Main Content - Outlet renders the child routes */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${drawerWidth}px)` }}>
                <Outlet />
            </Box>
        </Box>
    );
}

