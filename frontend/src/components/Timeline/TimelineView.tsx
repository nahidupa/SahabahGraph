import React, { useMemo } from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import type { Sahabi } from '../../types';
import { useTranslation } from 'react-i18next';

interface TimelineViewProps {
  nodes: Sahabi[];
  onSelectNode: (node: Sahabi) => void;
  selectedNode: Sahabi | null;
}

const TimelineView: React.FC<TimelineViewProps> = ({ nodes, onSelectNode, selectedNode }) => {
  const { t } = useTranslation();

  const timelineData = useMemo(() => {
    const validNodes = nodes.filter(n => n.birth_year !== undefined && n.death_year !== undefined);
    if (validNodes.length === 0) return { nodes: [], minYear: 0, maxYear: 0 };

    const minYear = Math.min(...validNodes.map(n => n.birth_year!));
    const maxYear = Math.max(...validNodes.map(n => n.death_year!));

    // Sort nodes by birth year
    const sortedNodes = [...validNodes].sort((a, b) => (a.birth_year || 0) - (b.birth_year || 0));

    return { nodes: sortedNodes, minYear, maxYear };
  }, [nodes]);

  const { nodes: filteredNodes, minYear, maxYear } = timelineData;
  const range = maxYear - minYear || 1;

  if (filteredNodes.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          {t('no_temporal_data')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
        {t('timeline_view')}
      </Typography>

      <Box sx={{ position: 'relative', minWidth: 800, mt: 5 }}>
        {/* Year Markers */}
        <Box sx={{ position: 'relative', height: 30, mb: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
          {Array.from({ length: Math.ceil(range / 10) + 1 }).map((_, i) => {
            const year = Math.floor(minYear / 10) * 10 + i * 10;
            if (year < minYear || year > maxYear) return null;
            const left = ((year - minYear) / range) * 100;
            return (
              <Box key={year} sx={{ position: 'absolute', left: `${left}%`, transform: 'translateX(-50%)' }}>
                <Box sx={{ height: 10, width: 2, bgcolor: 'text.secondary', mx: 'auto' }} />
                <Typography variant="caption" color="textSecondary">
                  {year < 0 ? `${Math.abs(year)} BH` : `${year} AH`}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Lifespan Bars */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredNodes.map((node) => {
            const left = ((node.birth_year! - minYear) / range) * 100;
            const width = ((node.death_year! - node.birth_year!) / range) * 100;
            const isSelected = selectedNode?.id === node.id;
            const isBattle = node.node_type === 'Battle';

            return (
              <Box
                key={node.id}
                onClick={() => onSelectNode(node)}
                sx={{
                  position: 'relative',
                  height: 32,
                  width: '100%',
                  cursor: 'pointer',
                  '&:hover .bar': {
                    opacity: 0.8,
                    filter: 'brightness(1.1)'
                  }
                }}
              >
                <Tooltip title={`${node.name} (${node.birth_year} - ${node.death_year} AH)`}>
                  <Paper
                    className="bar"
                    elevation={isSelected ? 4 : 1}
                    sx={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: isBattle ? '10px' : `${Math.max(width, 0.5)}%`,
                      height: '100%',
                      bgcolor: isBattle ? '#795548' : (node.gender === 'male' ? (node.is_prophet === 'True' ? '#ffd700' : '#2196f3') : '#e91e63'),
                      border: isSelected ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: isBattle ? '50%' : 1,
                      display: 'flex',
                      alignItems: 'center',
                      px: isBattle ? 0 : 1,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      zIndex: isSelected ? 2 : 1,
                    }}
                  >
                    {!isBattle && width > 10 && (
                      <Typography variant="caption" sx={{ color: node.is_prophet === 'True' ? 'black' : 'white', fontWeight: 'bold' }}>
                        {node.name}
                      </Typography>
                    )}
                  </Paper>
                </Tooltip>
                {(!isBattle && width <= 10) && (
                   <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      left: `${left + width + 0.5}%`,
                      lineHeight: '32px',
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}
                  >
                    {node.name}
                  </Typography>
                )}
                {isBattle && (
                   <Typography
                   variant="caption"
                   sx={{
                     position: 'absolute',
                     left: `${left + 1.5}%`,
                     lineHeight: '32px',
                     fontWeight: isSelected ? 'bold' : 'normal'
                   }}
                 >
                   {node.name}
                 </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default TimelineView;
