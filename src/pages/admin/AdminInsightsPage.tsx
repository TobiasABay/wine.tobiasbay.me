import { UserButton, useUser } from "@clerk/clerk-react";
import { Box, Typography, CircularProgress, Alert, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import TopPerformersInsight from "../../components/admin/TopPerformersInsight";
import CategoryAccuracyInsight from "../../components/admin/CategoryAccuracyInsight";
import WineRatingsInsight from "../../components/admin/WineRatingsInsight";
import WineCharacteristicsInsight from "../../components/admin/WineCharacteristicsInsight";
import ActiveEventsInsight from "../../components/admin/ActiveEventsInsight";
import CommonMistakesInsight from "../../components/admin/CommonMistakesInsight";

interface InsightsData {
    topPerformers: any[];
    wineRatings: any[];
    categoryAccuracy: any[];
    activeEvents: any[];
    commonMistakes: any[];
    grapeVarieties: any[];
    countries: any[];
    wineTypes: any[];
}

export default function AdminInsightsPage() {
    const { user } = useUser();
    const [insights, setInsights] = useState<InsightsData>({
        topPerformers: [],
        wineRatings: [],
        categoryAccuracy: [],
        activeEvents: [],
        commonMistakes: [],
        grapeVarieties: [],
        countries: [],
        wineTypes: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = 'Wine Tasting - Admin Insights';
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiService.getInsightsData();
            setInsights(response.insights);
        } catch (err: any) {
            setError(err.message || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

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
                        Insights Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Admin'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="Refresh insights">
                        <IconButton
                            onClick={loadInsights}
                            disabled={loading}
                            sx={{
                                color: '#1976d2',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                            }}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <UserButton afterSignOutUrl="/" />
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Insights Grid */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Row 1: Top Performers & Wine Ratings */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
                    <TopPerformersInsight data={insights.topPerformers} />
                    <WineRatingsInsight data={insights.wineRatings} />
                </Box>

                {/* Row 2: Category Insights */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    <CategoryAccuracyInsight
                        data={insights.categoryAccuracy}
                        title="Most Guessed Categories"
                        type="all"
                    />
                    <CategoryAccuracyInsight
                        data={insights.categoryAccuracy}
                        title="Hardest Categories"
                        type="hardest"
                    />
                    <CategoryAccuracyInsight
                        data={insights.categoryAccuracy}
                        title="Easiest Categories"
                        type="easiest"
                    />
                </Box>

                {/* Row 3: Wine Characteristics & Common Mistakes */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                    <WineCharacteristicsInsight
                        grapeVarieties={insights.grapeVarieties}
                        countries={insights.countries}
                        wineTypes={insights.wineTypes}
                    />
                    <CommonMistakesInsight data={insights.commonMistakes} />
                </Box>

                {/* Row 4: Active Events */}
                <ActiveEventsInsight data={insights.activeEvents} />
            </Box>
        </>
    );
}
