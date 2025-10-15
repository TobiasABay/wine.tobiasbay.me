import { Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Dashboard, EventNote, Home, Insights, Feedback, Wifi } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const drawerWidth = 240;

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

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
                        <ListItemButton>
                            <ListItemIcon>
                                <Insights />
                            </ListItemIcon>
                            <ListItemText primary="Insights" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/admin/feedback')}>
                            <ListItemIcon>
                                <Feedback />
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

