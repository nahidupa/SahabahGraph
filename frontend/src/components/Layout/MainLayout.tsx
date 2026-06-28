import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { useTranslation } from 'react-i18next';
import { getTheme } from '../../theme';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
  key: 'muiltr',
});

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  detailPanel: React.ReactNode;
  tour?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, sidebar, detailPanel, tour }) => {
  const { i18n } = useTranslation();
  const direction = i18n.dir();
  const theme = getTheme(direction);

  return (
    <CacheProvider value={direction === 'rtl' ? cacheRtl : cacheLtr}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {tour}
        <Box
          sx={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
          }}
          dir={direction}
        >
          {sidebar}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              position: 'relative', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: { xs: 'auto', md: 'hidden' }
            }}
          >
            <Box sx={{ 
              flexGrow: 1, 
              position: 'relative', 
              overflow: 'hidden',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {children}
            </Box>
          </Box>
          {detailPanel}
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MainLayout;
