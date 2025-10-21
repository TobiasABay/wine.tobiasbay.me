import { type ReactNode, useState } from 'react';
import { IconButton, Popover, Box, Typography } from '@mui/material';
import { Info } from '@mui/icons-material';

interface InfoBoxProps {
  title: string;
  children: ReactNode;
  iconSize?: 'small' | 'medium' | 'large';
  maxWidth?: number;
  variant?: 'floating' | 'inline';
}

export default function InfoBox({
  title,
  children,
  iconSize = 'small',
  maxWidth = 400,
  variant = 'floating'
}: InfoBoxProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  if (variant === 'inline') {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <IconButton
          onClick={handleClick}
          size={iconSize}
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'transparent',
            borderRadius: '50%',
            width: 24,
            height: 24,
            minWidth: 'auto',
            padding: 0,
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.1)'
            }
          }}
        >
          <Info fontSize="small" />
        </IconButton>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          slotProps={{
            paper: {
              sx: {
                maxWidth,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                p: 2,
                mt: 0.5
              }
            }
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.6)',
                mb: 0.5,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(0, 0, 0, 0.6)',
                lineHeight: 1.4,
                fontSize: '0.8rem'
              }}
            >
              {children}
            </Typography>
          </Box>
        </Popover>
      </Box>
    );
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size={iconSize}
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            color: 'rgba(255, 255, 255, 0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Info fontSize={iconSize} />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              maxWidth,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              p: 2
            }
          }
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'rgba(0, 0, 0, 0.7)',
              mb: 1,
              letterSpacing: '0.5px'
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(0, 0, 0, 0.7)',
              lineHeight: 1.6
            }}
          >
            {children}
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
