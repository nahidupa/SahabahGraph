/**
 * Skeleton loader component to display while data is loading
 * Prevents layout shift and improves perceived performance
 */

import React from 'react';
import {
  Box,
  Skeleton,
  Paper,
  Stack,
  useTheme,
} from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'sidebar' | 'graph' | 'detail' | 'full';
}

const SkeletonSidebar: React.FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: 300,
        height: '100vh',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}
    >
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3, borderRadius: 1 }} />
      
      <Stack spacing={1.5}>
        {[...Array(8)].map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

const SkeletonGraph: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        flex: 1,
        height: '100%',
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Simulate graph nodes */}
      {[
        { top: '20%', left: '30%', size: 80 },
        { top: '30%', left: '60%', size: 60 },
        { top: '50%', left: '40%', size: 60 },
        { top: '60%', left: '70%', size: 50 },
        { top: '70%', left: '25%', size: 50 },
      ].map((node, i) => (
        <Skeleton
          key={i}
          variant="circular"
          width={node.size}
          height={node.size}
          sx={{
            position: 'absolute',
            top: node.top,
            left: node.left,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      
      {/* Loading message */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Skeleton variant="text" width={200} height={32} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width={150} height={20} sx={{ mx: 'auto' }} />
      </Box>
    </Box>
  );
};

const SkeletonDetail: React.FC = () => {
  return (
    <Paper
      elevation={2}
      sx={{
        width: 350,
        height: '100vh',
        borderLeft: 1,
        borderColor: 'divider',
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="80%" height={28} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      </Box>
      
      <Stack spacing={2}>
        {[...Array(5)].map((_, i) => (
          <Box key={i}>
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'full' }) => {
  if (variant === 'sidebar') {
    return <SkeletonSidebar />;
  }
  
  if (variant === 'graph') {
    return <SkeletonGraph />;
  }
  
  if (variant === 'detail') {
    return <SkeletonDetail />;
  }
  
  // Full layout skeleton
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <SkeletonSidebar />
      <SkeletonGraph />
    </Box>
  );
};

export default SkeletonLoader;
