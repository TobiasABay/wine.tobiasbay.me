import { Button } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import { useFullscreen } from '../hooks/useFullscreen';

interface FullscreenButtonProps {
    sx?: object;
}

export default function FullscreenButton({ sx = {} }: FullscreenButtonProps) {
    const { isFullscreen, toggleFullscreen } = useFullscreen();

    return (
        <Button
            onClick={toggleFullscreen}
            sx={{
                color: 'white',
                scale: 1.2,
                '&:hover': {
                    scale: 1.4,
                    backgroundColor: 'rgba(255,255,255,0.1)'
                },
                ...sx
            }}
        >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </Button>
    );
}
