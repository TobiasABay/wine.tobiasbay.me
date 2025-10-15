import { UserButton, useUser } from "@clerk/clerk-react";
import { Box, Typography, Paper, Card, CardContent, IconButton, Tooltip } from "@mui/material";
import { TrendingUp, CalendarToday, DateRange, AccessTime, Refresh } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { apiService } from "../../services/api";

interface ActivityStats {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
}

export default function AdminDashboardPage() {
    const { user } = useUser();
    const [activityStats, setActivityStats] = useState<ActivityStats>({
        last24Hours: 0,
        lastWeek: 0,
        lastMonth: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Wine Tasting - Admin Dashboard';
    }, []);

    const fetchActivityStats = async () => {
        try {
            setLoading(true);
            
            // Fetch all events with players (admin endpoint includes inactive events and players)
            const eventsWithPlayers = await apiService.getAdminAllEvents();

            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            let count24h = 0;
            let countWeek = 0;
            let countMonth = 0;

            // Count players who joined events based on when the event was created
            eventsWithPlayers.forEach(event => {
                const eventCreatedAt = new Date(event.created_at);
                const playerCount = event.players?.length || 0;

                // If event was created in last 24 hours, count all its players
                if (eventCreatedAt >= last24Hours) {
                    count24h += playerCount;
                }

                // If event was created in last week, count all its players
                if (eventCreatedAt >= lastWeek) {
                    countWeek += playerCount;
                }

                // If event was created in last month, count all its players
                if (eventCreatedAt >= lastMonth) {
                    countMonth += playerCount;
                }
            });

            setActivityStats({
                last24Hours: count24h,
                lastWeek: countWeek,
                lastMonth: countMonth
            });
        } catch (error) {
            console.error('Error fetching activity stats:', error);
            // Fallback to 0 on error
            setActivityStats({
                last24Hours: 0,
                lastWeek: 0,
                lastMonth: 0
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivityStats();
    }, []);

    const statCards = [
        {
            title: 'Last 24 Hours',
            value: activityStats.last24Hours,
            icon: AccessTime,
            color: '#1976d2',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        {
            title: 'Last Week',
            value: activityStats.lastWeek,
            icon: CalendarToday,
            color: '#2e7d32',
            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
        },
        {
            title: 'Last Month',
            value: activityStats.lastMonth,
            icon: DateRange,
            color: '#ed6c02',
            gradient: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)'
        }
    ];

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
                        Admin Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Admin'}
                    </Typography>
                </Box>
                <UserButton afterSignOutUrl="/" />
            </Box>

            {/* User Activity Stats */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        User Activity
                    </Typography>
                    <Tooltip title="Refresh stats">
                        <IconButton
                            onClick={fetchActivityStats}
                            disabled={loading}
                            sx={{
                                color: '#1976d2',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                            }}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 3
                }}>
                    {statCards.map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card
                                key={index}
                                sx={{
                                    position: 'relative',
                                    overflow: 'visible',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 2
                                    }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: 'text.secondary',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: 1
                                            }}
                                        >
                                            {stat.title}
                                        </Typography>
                                        <Box
                                            sx={{
                                                background: stat.gradient,
                                                borderRadius: '12px',
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `0 4px 12px ${stat.color}40`
                                            }}
                                        >
                                            <IconComponent sx={{ color: 'white', fontSize: 28 }} />
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="h3"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: stat.color,
                                            mb: 1
                                        }}
                                    >
                                        {loading ? '...' : stat.value.toLocaleString()}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                            Active users
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            </Box>

            {/* Additional Dashboard Content */}
            <Paper sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📊 More Analytics Coming Soon
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Additional dashboard features and detailed analytics will be available here.
                </Typography>
            </Paper>
        </>
    );
}