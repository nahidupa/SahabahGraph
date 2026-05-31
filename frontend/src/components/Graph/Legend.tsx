import React from 'react';
import { Paper, Typography, Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LEGEND_ITEMS = [
  { label: 'is_prophet', color: '#ffd700', shape: 'star' },
  { label: 'male', color: '#2196f3', shape: 'circle' },
  { label: 'female', color: '#e91e63', shape: 'circle' },
  { label: 'Battle', color: '#795548', shape: 'diamond' },
  { label: 'family_rel', color: '#4caf50', isEdge: true },
  { label: 'academic_rel', color: '#ff9800', isEdge: true },
  { label: 'other_rel', color: '#9e9e9e', isEdge: true },
];

const Legend: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        p: 1.5,
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1000,
        display: { xs: 'none', md: 'block' }
      }}
    >
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('legend_title', { defaultValue: 'Legend' })}
      </Typography>
      <Stack spacing={1}>
        {LEGEND_ITEMS.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {item.isEdge ? (
              <Box sx={{ width: 20, height: 3, bgcolor: item.color, borderRadius: 1 }} />
            ) : (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: item.color,
                  borderRadius: item.shape === 'circle' ? '50%' : item.shape === 'star' ? '2px' : '0',
                  transform: item.shape === 'diamond' ? 'rotate(45deg)' : 'none'
                }}
              />
            )}
            <Typography variant="caption">
              {t(`legend.${item.label}`, { defaultValue: item.label })}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default Legend;
