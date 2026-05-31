import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Divider,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Language as LanguageIcon
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

  const handleLanguageChange = (event: any) => {
    i18n.changeLanguage(event.target.value);
  };

  if (collapsed) {
    return (
      <Box sx={{ width: 40, height: '100vh', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
        <IconButton onClick={() => setCollapsed(false)}>
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
        '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box', position: 'relative' },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{t('app_name')}</Typography>
        <IconButton onClick={() => setCollapsed(true)}>
          {i18n.dir() === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="language-select-label">{t('language')}</InputLabel>
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
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }
          }}
        />
      </Box>
      <Divider />
      <List sx={{ overflowY: 'auto' }}>
        {nodes.map((node) => (
          <ListItem
            key={node.id}
            component="div"
            disablePadding
            secondaryAction={
              <IconButton edge="end" onClick={() => onAddNode(node)} title={t('add_to_graph')}>
                <AddIcon />
              </IconButton>
            }
          >
            <Button
              fullWidth
              sx={{ textAlign: 'left', justifyContent: 'flex-start', color: 'inherit', textTransform: 'none', px: 2 }}
              onClick={() => onSelectNode(node)}
            >
              <ListItemText primary={node.name} secondary={node.title} />
            </Button>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default SahabahSidebar;
