import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Paper, Tooltip, Chip, Tab, Tabs } from '@mui/material';
import type { Sahabi, PoliticalData } from '../../types';
import { useTranslation } from 'react-i18next';

interface TimelineViewProps {
  nodes: Sahabi[];
  onSelectNode: (node: Sahabi) => void;
  selectedNode: Sahabi | null;
}

const TimelineView: React.FC<TimelineViewProps> = ({ nodes, onSelectNode, selectedNode }) => {
  const { t, i18n } = useTranslation();
  const [politicalData, setPoliticalData] = useState<PoliticalData | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetch('/data/political_terms.json')
      .then(res => res.json())
      .then(data => setPoliticalData(data))
      .catch(err => console.error("Failed to load political data for timeline", err));
  }, []);

  const timelineData = useMemo(() => {
    const validNodes = nodes.filter(n =>
      n.node_type !== 'Battle' &&
      n.birth_year_hijri !== undefined &&
      n.death_year_hijri !== undefined &&
      (n.birth_year_hijri !== 0 || n.death_year_hijri !== 0)
    );

    const battleNodes = nodes.filter(n => n.node_type === 'Battle' && n.birth_year_hijri !== undefined);

    const allYears = [
      ...validNodes.flatMap(n => [n.birth_year_hijri!, n.death_year_hijri!]),
      ...battleNodes.map(n => n.birth_year_hijri!),
      ...(politicalData?.terms.flatMap(t => [t.start_year_hijri, t.end_year_hijri]) || [])
    ].filter(y => y !== 0 && y < 1000); // Filter out outliers

    const minYear = allYears.length > 0 ? Math.min(...allYears) : -53;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 110;

    const sortedNodes = [...validNodes].sort((a, b) => (a.birth_year_hijri || 0) - (b.birth_year_hijri || 0));

    return {
      nodes: sortedNodes,
      battleNodes: battleNodes.sort((a, b) => a.birth_year_hijri! - b.birth_year_hijri!),
      minYear,
      maxYear
    };
  }, [nodes, politicalData]);

  const { nodes: filteredNodes, battleNodes, minYear, maxYear } = timelineData;
  const range = maxYear - minYear || 1;

  const renderTimelineLane = (title: string, content: React.ReactNode) => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ position: 'relative', minHeight: 100 }}>
        {content}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', p: 4, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {t('timeline_view')}
        </Typography>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={t('lifespans', { defaultValue: 'Lifespans' })} />
          <Tab label={t('political_tenure', { defaultValue: 'Political Tenure' })} />
        </Tabs>
      </Box>

      <Box sx={{ position: 'relative', minWidth: 1200, mt: 2, p: 4, bgcolor: 'background.paper', borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        {/* Year Markers */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', height: 45, mb: 4, borderBottom: '2px solid', borderColor: 'primary.light' }}>
          {Array.from({ length: Math.ceil(range / 10) + 1 }).map((_, i) => {
            const year = Math.floor(minYear / 10) * 10 + i * 10;
            if (year < minYear - 10 || year > maxYear + 10) return null;
            const left = ((year - minYear) / range) * 100;
            return (
              <Box key={year} sx={{ position: 'absolute', left: `${left}%`, transform: 'translateX(-50%)' }}>
                <Box sx={{ height: 10, width: 2, bgcolor: 'text.secondary', mx: 'auto' }} />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                  {year < 0 ? `${Math.abs(year)} BH` : `${year} AH`}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {tabValue === 0 && (
          <>
            {/* Battles Lane */}
            {renderTimelineLane(t('major_battles', { defaultValue: 'Major Battles' }), (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', minHeight: 40 }}>
                {battleNodes.map(battle => {
                  const left = ((battle.birth_year_hijri! - minYear) / range) * 100;
                  return (
                    <Tooltip key={battle.id} title={`${battle.name_en} (${battle.birth_year_hijri} AH)`}>
                      <Chip
                        label={i18n.language.startsWith('ar') ? battle.name_ar : battle.name_en}
                        onClick={() => onSelectNode(battle)}
                        sx={{
                          position: 'absolute',
                          left: `${left}%`,
                          transform: 'translateX(-50%)',
                          bgcolor: '#795548',
                          color: 'white',
                          fontWeight: 'bold',
                          '&:hover': { bgcolor: '#5d4037' },
                          zIndex: 5
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            ))}

            {/* Lifespans Lane */}
            {renderTimelineLane(t('sahabah_lifespans', { defaultValue: 'Sahabah Lifespans' }), (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredNodes.map((node) => {
                  const b = node.birth_year_hijri || minYear;
                  const d = node.death_year_hijri || maxYear;
                  const left = ((b - minYear) / range) * 100;
                  const width = ((d - b) / range) * 100;
                  const isSelected = selectedNode?.id === node.id;
                  const isEstimated = !node.birth_year_hijri || !node.death_year_hijri || node.birth_year_hijri === 0 || node.death_year_hijri === 0;

                  return (
                    <Box
                      key={node.id}
                      onClick={() => onSelectNode(node)}
                      sx={{
                        position: 'relative',
                        height: 32,
                        width: '100%',
                        cursor: 'pointer',
                        '&:hover .bar': { opacity: 0.9, filter: 'brightness(1.05)' }
                      }}
                    >
                      <Tooltip title={`${node.name_en} (${node.birth_year_hijri || '?'} - ${node.death_year_hijri || '?'} AH)`}>
                        <Paper
                          className="bar"
                          sx={{
                            position: 'absolute',
                            left: `${left}%`,
                            width: `${Math.max(width, 0.5)}%`,
                            height: '100%',
                            bgcolor: node.is_prophet === 'True' ? '#ffd700' : (node.gender === 'male' ? '#2196f3' : '#e91e63'),
                            opacity: isEstimated ? 0.4 : 1,
                            border: isSelected ? '2px solid black' : 'none',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <Typography variant="caption" sx={{ color: node.is_prophet === 'True' ? 'black' : 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {i18n.language.startsWith('ar') ? node.name_ar : node.name_en}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </>
        )}

        {tabValue === 1 && politicalData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {politicalData.cities.map(city => {
              const cityTerms = politicalData.terms.filter(t => t.city_id === city.id);
              if (cityTerms.length === 0) return null;

              return (
                <Box key={city.id}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {i18n.language.startsWith('ar') ? city.name_ar : city.name_en}
                  </Typography>
                  <Box sx={{ position: 'relative', height: 40, bgcolor: 'action.hover', borderRadius: 1 }}>
                    {cityTerms.map(term => {
                      const left = ((term.start_year_hijri - minYear) / range) * 100;
                      const width = ((term.end_year_hijri - term.start_year_hijri) / range) * 100;

                      return (
                        <Tooltip key={term.id} title={`${term.governor_name || 'Vacancy'} under ${term.caliph_name} (${term.start_year_hijri}-${term.end_year_hijri} AH)`}>
                          <Paper
                            sx={{
                              position: 'absolute',
                              left: `${left}%`,
                              width: `${Math.max(width, 0.2)}%`,
                              height: '100%',
                              bgcolor: term.vacancy ? 'grey.400' : 'success.main',
                              borderRight: '1px solid white',
                              borderRadius: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              '&:hover': { filter: 'brightness(1.1)' }
                            }}
                          >
                            {width > 3 && (
                              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.65rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                {term.governor_name?.split(' ')[0]}
                              </Typography>
                            )}
                          </Paper>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TimelineView;
