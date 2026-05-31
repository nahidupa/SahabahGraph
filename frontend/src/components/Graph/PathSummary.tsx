import React from 'react';
import { Paper, Typography, Box, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, ArrowForward as ArrowIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { GraphData } from '../../types';

interface PathSummaryProps {
  path: string[];
  data: GraphData | null;
  onClose: () => void;
}

const PathSummary: React.FC<PathSummaryProps> = ({ path, data, onClose }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  if (!path || path.length === 0 || !data) return null;

  const pathElements = [];
  for (let i = 0; i < path.length; i++) {
    const node = data.nodes.find(n => n.id.toString() === path[i]);
    if (node) {
      pathElements.push({ type: 'node', label: node.name });
    }

    if (i < path.length - 1) {
      const u = path[i];
      const v = path[i + 1];
      const rel = data.links.find(l =>
        (l.source_id.toString() === u && l.target_id.toString() === v) ||
        (l.source_id.toString() === v && l.target_id.toString() === u)
      );
      if (rel) {
        pathElements.push({ type: 'edge', label: rel.type });
      }
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        p: 2,
        maxWidth: '80%',
        maxHeight: '150px',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="primary">Path Summary</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        useFlexGap
      >
        {pathElements.map((el, idx) => (
          <React.Fragment key={idx}>
            {el.type === 'node' ? (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: 'action.selected',
                  px: 1,
                  borderRadius: 1
                }}
              >
                {el.label}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isRtl ? <ArrowBackIcon fontSize="small" color="disabled" /> : <ArrowIcon fontSize="small" color="disabled" />}
                <Typography variant="caption" color="text.secondary">
                  {el.label}
                </Typography>
                {isRtl ? <ArrowBackIcon fontSize="small" color="disabled" /> : <ArrowIcon fontSize="small" color="disabled" />}
              </Box>
            )}
          </React.Fragment>
        ))}
      </Stack>
    </Paper>
  );
};

export default PathSummary;
