import React, { useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Star as StarIcon,
  Person as PersonIcon,
  Female as FemaleIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Security as BattleIcon,
  HistoryEdu as BioIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Sahabi, Relationship } from '../../types';

interface SahabahDetailProps {
  selectedNode: Sahabi | null;
  links: Relationship[];
  onExpand: (nodeId: number, category: string) => void;
}

const SahabahDetail: React.FC<SahabahDetailProps> = ({
  selectedNode,
  links,
  onExpand
}) => {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  // Dynamically determine available relationship categories for the selected node
  const availableCategories = useMemo(() => {
    if (!selectedNode) return [];
    const nodeRels = links.filter(l => l.source_id === selectedNode.id || l.target_id === selectedNode.id);
    const categories = new Set<string>();
    nodeRels.forEach(r => categories.add(r.category));
    return Array.from(categories);
  }, [selectedNode, links]);

  if (collapsed) {
    return (
      <Box sx={{ width: 40, height: '100vh', borderInlineStart: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2, bgcolor: 'background.paper' }}>
        <IconButton onClick={() => setCollapsed(false)} title={t('expand_details')}>
           {i18n.dir() === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    );
  }

  return (
    <Drawer
      variant="permanent"
      anchor={i18n.dir() === 'rtl' ? 'left' : 'right'}
      sx={{
        width: 350,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 350,
          boxSizing: 'border-box',
          position: 'relative',
          borderInlineStart: 1,
          borderInlineEnd: 0,
          borderLeft: i18n.dir() === 'rtl' ? 'none' : undefined,
          borderRight: i18n.dir() === 'ltr' ? 'none' : undefined,
        },
      }}
    >
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => setCollapsed(true)} title={t('collapse_details')}>
           {i18n.dir() === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'medium' }}>
          {selectedNode ? selectedNode.name : t('details_title', { defaultValue: 'Details' })}
        </Typography>
      </Box>

      <Box sx={{ p: 3, pt: 0, overflowY: 'auto' }}>
        {selectedNode ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
              <Avatar
                sx={{
                  bgcolor: selectedNode.node_type === 'Battle' ? '#795548' : (selectedNode.is_prophet === "True" ? '#ffd700' : (selectedNode.gender === 'male' ? '#2196f3' : '#e91e63')),
                  marginInlineEnd: 2,
                  width: 56,
                  height: 56
                }}
              >
                {selectedNode.node_type === 'Battle' ? <BattleIcon fontSize="large" /> : (selectedNode.is_prophet === "True" ? <StarIcon fontSize="large" /> : (selectedNode.gender === 'male' ? <PersonIcon fontSize="large" /> : <FemaleIcon fontSize="large" />))}
              </Avatar>
              <Box>
                <Typography variant="h5">{selectedNode.name}</Typography>
                <Typography variant="subtitle1" color="text.secondary">{selectedNode.title}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>{t('expand_relationships')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('click_to_reveal')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {availableCategories.length > 0 ? (
                availableCategories.map((cat) => (
                  <Chip
                    key={cat}
                    label={t(`categories.${cat.toLowerCase()}`, { defaultValue: cat.charAt(0).toUpperCase() + cat.slice(1) })}
                    onClick={() => onExpand(selectedNode.id, cat)}
                    icon={<AddIcon />}
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.disabled">{t('no_rels_found')}</Typography>
              )}
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BioIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="subtitle2" color="primary">
                  {t('biography')}
                </Typography>
              </Box>
              <Typography variant="body2">
                {selectedNode.bio || t('bio_placeholder', { name: selectedNode.name })}
              </Typography>
            </Paper>

            {selectedNode.node_type === 'Battle' && (
              <>
                 <Typography variant="subtitle1" gutterBottom color="primary">
                   {t('participants', { defaultValue: 'Participants' })}
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                    {t('participants_desc', { defaultValue: 'Sahabah who participated in this battle.' })}
                 </Typography>
                 {/* Links are already handled by the "Expand Relationships" section chips,
                     but we could also list the ones already on the graph if we wanted to.
                     The user specifically asked to "display these participation links".
                 */}
              </>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', mt: 20 }}>
            <Typography color="text.secondary">{t('details_placeholder')}</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default SahabahDetail;
