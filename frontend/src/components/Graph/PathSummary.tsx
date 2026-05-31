import React from 'react';
import { Paper, Typography, Box, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, ArrowForward as ArrowIcon, ArrowBack as ArrowBackIcon, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { GraphData } from '../../types';

interface PathSummaryProps {
  path: string[];
  data: GraphData | null;
  onClose: () => void;
  totalPaths?: number;
  currentPathIndex?: number;
  onNext?: () => void;
  onPrev?: () => void;
}

const PathSummary: React.FC<PathSummaryProps> = ({
  path,
  data,
  onClose,
  totalPaths = 1,
  currentPathIndex = 0,
  onNext,
  onPrev
}) => {
  const { i18n, t } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  if (!path || path.length === 0 || !data) return null;

  const pathElements = [];
  for (let i = 0; i < path.length; i++) {
    const node = data.nodes.find(n => n.id.toString() === path[i]);
    if (node) {
      pathElements.push({ type: 'node', label: i18n.language.startsWith('ar') && node.name_ar ? node.name_ar : node.name_en });
    }

    if (i < path.length - 1) {
      const u = path[i];
      const v = path[i + 1];
      const rel = data.links.find(l =>
        (l.source.toString() === u && l.target.toString() === v) ||
        (l.source.toString() === v && l.target.toString() === u)
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
        maxWidth: '90%',
        maxHeight: '250px',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2" color="primary">{t('path_summary')}</Typography>
          {totalPaths > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" onClick={onPrev}><ChevronLeft fontSize="small" /></IconButton>
              <Typography variant="caption">{currentPathIndex + 1} / {totalPaths}</Typography>
              <IconButton size="small" onClick={onNext}><ChevronRight fontSize="small" /></IconButton>
            </Box>
          )}
        </Box>
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
                  {t(`relationships.${el.label}`, { defaultValue: el.label })}
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
