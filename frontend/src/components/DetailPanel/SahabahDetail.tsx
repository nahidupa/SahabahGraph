import React, { useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Chip,
  Paper
} from '@mui/material';
import {
  Star as StarIcon,
  Person as PersonIcon,
  Female as FemaleIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Security as BattleIcon,
  HistoryEdu as BioIcon,
  Groups as TribeIcon,
  AccountTree as ClanIcon,
  EventNote as DateIcon,
  Source as SourceIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Sahabi, Relationship } from '../../types';

interface SahabahDetailProps {
  selectedNode: Sahabi | null;
  links: Relationship[];
  onExpand: (nodeId: number | string, categoryOrType: string) => void;
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
    const selectedId = String(selectedNode.id);
    const nodeRels = links.filter(
      (l) => String(l.source_id) === selectedId || String(l.target_id) === selectedId
    );
    const categories = new Set<string>();
    nodeRels.forEach(r => categories.add(r.category));
    return Array.from(categories);
  }, [selectedNode, links]);

  const availableRelationshipTypes = useMemo(() => {
    if (!selectedNode) return [];
    const selectedId = String(selectedNode.id);
    const nodeRels = links.filter(
      (l) => String(l.source_id) === selectedId || String(l.target_id) === selectedId
    );
    const types = new Set<string>();
    nodeRels.forEach((r) => types.add(r.type));
    return Array.from(types);
  }, [selectedNode, links]);

  const relationshipAvailability = useMemo(() => {
    if (!selectedNode) return [];

    if (selectedNode.node_type === 'Battle') {
      return [
        {
          key: 'participants',
          label: t('relation_flags.participants', { defaultValue: 'Participants' }),
          enabled: selectedNode.has_participants === true,
          relationType: 'PARTICIPATED_IN',
        },
      ];
    }

    return [
      {
        key: 'parents',
        label: t('relation_flags.parents', { defaultValue: 'Parents' }),
        enabled: selectedNode.has_parents === true,
        relationType: 'PARENT_OF',
      },
      {
        key: 'children',
        label: t('relation_flags.children', { defaultValue: 'Children' }),
        enabled: selectedNode.has_children === true,
        relationType: 'PARENT_OF',
      },
      {
        key: 'spouses',
        label: t('relation_flags.spouses', { defaultValue: 'Spouses' }),
        enabled: selectedNode.has_spouses === true,
        relationType: 'SPOUSE_OF',
      },
      {
        key: 'siblings',
        label: t('relation_flags.siblings', { defaultValue: 'Siblings' }),
        enabled: selectedNode.has_siblings === true,
        relationType: 'SIBLING_OF',
      },
      {
        key: 'uncles',
        label: t('relation_flags.uncles', { defaultValue: 'Uncles' }),
        enabled: selectedNode.has_uncles === true,
        relationType: 'UNCLE_OF',
      },
      {
        key: 'cousins',
        label: t('relation_flags.cousins', { defaultValue: 'Cousins' }),
        enabled: selectedNode.has_cousins === true,
        relationType: 'COUSIN_OF',
      },
      {
        key: 'companions',
        label: t('relation_flags.companions', { defaultValue: 'Companions' }),
        enabled: selectedNode.has_companions === true,
        relationType: 'COMPANION_OF',
      },
      {
        key: 'teachers',
        label: t('relation_flags.teachers', { defaultValue: 'Teachers' }),
        enabled: selectedNode.has_teachers === true,
        relationType: 'TEACHER_OF',
      },
      {
        key: 'students',
        label: t('relation_flags.students', { defaultValue: 'Students' }),
        enabled: selectedNode.has_students === true,
        relationType: 'TEACHER_OF',
      },
      {
        key: 'battles',
        label: t('relation_flags.battles', { defaultValue: 'Battles' }),
        enabled: selectedNode.has_battles === true,
        relationType: 'PARTICIPATED_IN',
      },
    ];
  }, [selectedNode, t]);

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
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <IconButton onClick={() => setCollapsed(true)} title={t('collapse_details')} sx={{ color: 'inherit' }}>
           {i18n.dir() === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedNode ? (i18n.language.startsWith('ar') && selectedNode.name_ar ? selectedNode.name_ar : selectedNode.name_en) : t('details_title', { defaultValue: 'Details' })}
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
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{selectedNode.name_en}</Typography>
                {selectedNode.name_ar && <Typography variant="h6" color="primary" sx={{ fontStyle: 'italic' }}>{selectedNode.name_ar}</Typography>}
                {selectedNode.kunyah && <Typography variant="subtitle2" color="text.secondary">{t('kunyah')}: {selectedNode.kunyah}</Typography>}
                <Typography variant="subtitle1" color="text.secondary">{selectedNode.laqab}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {selectedNode.node_type === 'Sahabi' && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {selectedNode.prominence && (
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                      <LabelIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      <Chip label={selectedNode.prominence} size="small" color="primary" variant="outlined" />
                    </Box>
                  )}
                  {selectedNode.tribe && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TribeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('tribe')}</Typography>
                        <Typography variant="body2">{selectedNode.tribe}</Typography>
                      </Box>
                    </Box>
                  )}
                  {selectedNode.clan && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ClanIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('clan')}</Typography>
                        <Typography variant="body2">{selectedNode.clan}</Typography>
                      </Box>
                    </Box>
                  )}
                  {(selectedNode.birth_year_hijri !== undefined || selectedNode.death_year_hijri !== undefined) && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DateIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('born')} / {t('died')} ({t('ah')})</Typography>
                        <Typography variant="body2">
                          {selectedNode.birth_year_hijri !== 0 ? selectedNode.birth_year_hijri : '?'} - {selectedNode.death_year_hijri !== 0 ? selectedNode.death_year_hijri : '?'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

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

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('relationship_types', { defaultValue: 'Relationship Types' })}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {availableRelationshipTypes.length > 0 ? (
                availableRelationshipTypes.map((type) => (
                  <Chip
                    key={type}
                    label={t(`relationships.${type}`, { defaultValue: type })}
                    onClick={() => onExpand(selectedNode.id, type)}
                    icon={<AddIcon />}
                    color="secondary"
                    variant="outlined"
                    clickable
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.disabled">{t('no_rels_found')}</Typography>
              )}
            </Box>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('relationship_availability', { defaultValue: 'Available Expansions' })}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {relationshipAvailability.some((item) => item.enabled) ? (
                relationshipAvailability
                  .filter((item) => item.enabled)
                  .map((item) => (
                    <Chip
                      key={item.key}
                      label={t('expand_relation_flag', {
                        label: item.label,
                        defaultValue: 'Expand {{label}}',
                      })}
                      onClick={() => onExpand(selectedNode.id, item.relationType)}
                      icon={<AddIcon />}
                      color="success"
                      variant="outlined"
                      clickable
                    />
                  ))
              ) : (
                <Typography variant="body2" color="text.disabled">{t('no_rels_found')}</Typography>
              )}
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BioIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="subtitle2" color="primary">
                  {t('biography')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedNode.biography_short || t('bio_placeholder', { name: selectedNode.name_en })}
              </Typography>
              {selectedNode.biography_source && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SourceIcon fontSize="inherit" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {t('source')}: {selectedNode.biography_source}
                  </Typography>
                </Box>
              )}
            </Paper>

            {selectedNode.node_type === 'Battle' && (
              <>
                 <Typography variant="subtitle1" gutterBottom color="primary">
                   {t('participants', { defaultValue: 'Participants' })}
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                    {t('participants_desc', { defaultValue: 'Sahabah who participated in this battle.' })}
                 </Typography>
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
