import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useTranslation } from 'react-i18next';
import type { GovernorTerm, PoliticalCity, Sahabi } from '../../types';

interface PoliticalViewProps {
  cities: PoliticalCity[];
  terms: GovernorTerm[];
  nodes: Sahabi[];
  onSelectGovernor: (node: Sahabi) => void;
  onLinkGovernor: (node: Sahabi) => void;
}

const PoliticalView: React.FC<PoliticalViewProps> = ({
  cities,
  terms,
  nodes,
  onSelectGovernor,
  onLinkGovernor,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedCityId, setSelectedCityId] = useState<string>(cities[0]?.id ?? '');
  const [selectedCaliph, setSelectedCaliph] = useState<string>('all');

  const caliphs = useMemo(() => {
    const names = Array.from(new Set(terms.map((term) => term.caliph_name))).sort();
    return ['all', ...names];
  }, [terms]);

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) ?? null,
    [cities, selectedCityId]
  );

  const filteredTerms = useMemo(() => {
    return terms
      .filter((term) => {
        if (selectedCityId && term.city_id !== selectedCityId) return false;
        if (selectedCaliph !== 'all' && term.caliph_name !== selectedCaliph) return false;
        return true;
      })
      .sort((a, b) => a.start_year_ce - b.start_year_ce);
  }, [selectedCityId, selectedCaliph, terms]);

  const findGovernorNode = (term: GovernorTerm): Sahabi | null => {
    if (!term.governor_id) return null;

    const byId = nodes.find((node) => String(node.id) === String(term.governor_id));
    if (byId) return byId;

    if (!term.governor_name) return null;
    const normalizedGovernorName = term.governor_name.trim().toLowerCase();
    return (
      nodes.find((node) => node.name_en.trim().toLowerCase() === normalizedGovernorName) ?? null
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, display: 'flex', gap: 2, bgcolor: 'background.default' }}>
      <Paper sx={{ flex: 1.2, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('city_map', { defaultValue: 'City Map' })}
          </Typography>
          <Chip label="Umayyad MVP" color="primary" size="small" />
        </Stack>

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 360,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            background:
              'radial-gradient(circle at 30% 35%, #d6ecff 0%, #c0dbf5 35%, #e9e1cc 36%, #e5d6ad 100%)',
          }}
        >
          <Box sx={{ position: 'absolute', top: 8, left: 8, px: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.88)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Eastern Mediterranean (schematic)
            </Typography>
          </Box>

          {cities.map((city) => {
            const isActive = city.id === selectedCityId;
            return (
              <Button
                key={city.id}
                onClick={() => setSelectedCityId(city.id)}
                sx={{
                  position: 'absolute',
                  left: `${city.x}%`,
                  top: `${city.y}%`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: 0,
                  p: 0.5,
                  borderRadius: '999px',
                  bgcolor: isActive ? 'error.main' : 'primary.main',
                  color: 'common.white',
                  '&:hover': { bgcolor: isActive ? 'error.dark' : 'primary.dark' },
                }}
              >
                <LocationOnIcon fontSize="small" />
              </Button>
            );
          })}

          {selectedCity && (
            <Box
              sx={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                p: 1,
                bgcolor: 'rgba(255,255,255,0.92)',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                maxWidth: 260,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {i18n.language.startsWith('ar') ? selectedCity.name_ar : selectedCity.name_en}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedCity.lat.toFixed(3)}, {selectedCity.lng.toFixed(3)}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('governor_terms', { defaultValue: 'Governor Terms' })}
        </Typography>

        <Stack direction="row" spacing={1}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('city', { defaultValue: 'City' })}</InputLabel>
            <Select
              value={selectedCityId}
              label={t('city', { defaultValue: 'City' })}
              onChange={(e) => setSelectedCityId(e.target.value)}
            >
              {cities.map((city) => (
                <MenuItem key={city.id} value={city.id}>
                  {i18n.language.startsWith('ar') ? city.name_ar : city.name_en}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>{t('caliph_filter', { defaultValue: 'Caliph' })}</InputLabel>
            <Select
              value={selectedCaliph}
              label={t('caliph_filter', { defaultValue: 'Caliph' })}
              onChange={(e) => setSelectedCaliph(e.target.value)}
            >
              {caliphs.map((caliph) => (
                <MenuItem key={caliph} value={caliph}>
                  {caliph === 'all' ? t('all_caliphs', { defaultValue: 'All Caliphs' }) : caliph}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Divider />

        <Box sx={{ overflow: 'auto', pr: 1 }}>
          {filteredTerms.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('no_governor_terms', { defaultValue: 'No governor terms found for this filter.' })}
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {filteredTerms.map((term) => {
                const governorNode = findGovernorNode(term);
                return (
                  <Paper
                    key={term.id}
                    variant="outlined"
                    sx={{ p: 1.25, cursor: governorNode ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (governorNode) {
                        onSelectGovernor(governorNode);
                      }
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {term.vacancy ? 'Vacancy / No Governor' : (term.governor_name ?? 'Unknown')}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${term.start_year_ce}–${term.end_year_ce} CE`}
                        color="default"
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {term.start_year_hijri}–{term.end_year_hijri} AH • {term.caliph_name}
                    </Typography>

                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      {t('termination', { defaultValue: 'Termination' })}: {term.termination}
                    </Typography>

                    {term.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {term.notes}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {!term.vacancy && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={!governorNode}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (governorNode) onSelectGovernor(governorNode);
                            }}
                          >
                            {t('show_in_details', { defaultValue: 'Show In Details' })}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!governorNode}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (governorNode) onLinkGovernor(governorNode);
                            }}
                          >
                            {t('show_in_graph', { defaultValue: 'Show In Graph' })}
                          </Button>
                        </>
                      )}
                      {term.source_ref && (
                        <Button
                          size="small"
                          href={term.source_ref}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Source
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PoliticalView;
