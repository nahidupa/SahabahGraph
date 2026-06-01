import React, { useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  Divider,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  type SelectChangeEvent
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Language as LanguageIcon,
  Clear as ClearIcon,
  SearchOff as SearchOffIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Sahabi } from '../../types';

interface SahabahSidebarProps {
  nodes: Sahabi[];
  onAddNode: (node: Sahabi) => void;
  onSelectNode: (node: Sahabi) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SahabahSidebar: React.FC<SahabahSidebarProps> = ({
  nodes,
  onAddNode,
  onSelectNode,
  searchTerm,
  onSearchChange
}) => {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTribe, setSelectedTribe] = useState('All');

  const tribes = useMemo(() => {
    const tSet = new Set<string>();
    nodes.forEach(n => {
      if (n.tribe && n.node_type === 'Sahabi') tSet.add(n.tribe);
    });
    return ['All', ...Array.from(tSet).sort()];
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesSearch = n.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (n.name_ar && n.name_ar.includes(searchTerm)) ||
                           (n.laqab && n.laqab.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (n.kunyah && n.kunyah.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTribe = selectedTribe === 'All' || n.tribe === selectedTribe;
      return matchesSearch && matchesTribe;
    });
  }, [nodes, searchTerm, selectedTribe]);

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  if (collapsed) {
    return (
      <Box sx={{ width: 40, height: '100vh', borderInlineEnd: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2, bgcolor: 'background.paper' }}>
        <IconButton onClick={() => setCollapsed(false)} title={t('expand_sidebar')}>
           {i18n.dir() === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 300,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 300,
          boxSizing: 'border-box',
          position: 'relative',
          borderInlineEnd: 1,
          borderInlineStart: 0,
          borderRight: i18n.dir() === 'rtl' ? 'none' : undefined,
          borderLeft: i18n.dir() === 'ltr' ? 'none' : undefined,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{t('app_name')}</Typography>
        <IconButton onClick={() => setCollapsed(true)} sx={{ color: 'inherit' }}>
          {i18n.dir() === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="language-select-label" aria-label={t('language')}>{t('language')}</InputLabel>
          <Select
            labelId="language-select-label"
            value={i18n.language.split('-')[0]}
            label={t('language')}
            onChange={handleLanguageChange}
            startAdornment={<LanguageIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ar">العربية</MenuItem>
            <MenuItem value="bn">বাংলা</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          placeholder={t('search_placeholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    aria-label={t('clear_search')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          }}
        />

        <FormControl fullWidth size="small">
          <InputLabel id="tribe-select-label">{t('tribe')}</InputLabel>
          <Select
            labelId="tribe-select-label"
            value={selectedTribe}
            label={t('tribe')}
            onChange={(e) => setSelectedTribe(e.target.value)}
          >
            {tribes.map(tribe => (
              <MenuItem key={tribe} value={tribe}>
                {tribe === 'All' ? t('all_tribes') : t(`tribes.${tribe}`, { defaultValue: tribe })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Divider />
      <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {filteredNodes.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
            <SearchOffIcon sx={{ fontSize: 48, mb: 2, color: 'text.disabled' }} />
            <Typography variant="body2">{t('no_results_found')}</Typography>
          </Box>
        ) : filteredNodes.map((node) => (
          <ListItem
            key={node.id}
            disablePadding
            secondaryAction={
              <IconButton
                size="small"
                onClick={() => onAddNode(node)}
                title={t('add_to_graph')} aria-label={t('add_to_graph')}
                sx={{ ml: 1 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton
              sx={{
                textAlign: i18n.dir() === 'rtl' ? 'right' : 'left',
                color: 'inherit',
                textTransform: 'none',
                px: 2,
                py: 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(46, 125, 50, 0.08)',
                  transform: 'translateX(4px)',
                },
              }}
              onClick={() => onSelectNode(node)}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(i18n.language.startsWith('ar') && node.name_ar) ? node.name_ar : (i18n.language.startsWith('bn') && node.name_bn) ? node.name_bn : (i18n.language.startsWith('de') && node.name_de) ? node.name_de : node.name_en}
                  </Typography>
                }
                secondary={
                  <React.Fragment>
                    {node.name_ar && <Typography component="span" variant="body2" color="primary" sx={{ display: 'block' }}>{node.name_ar}</Typography>}
                    {node.laqab}
                  </React.Fragment>
                }
                sx={{ textAlign: 'inherit' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default SahabahSidebar;
