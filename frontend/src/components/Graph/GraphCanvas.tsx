import React from 'react';
import { Box, Paper, IconButton, Tooltip, Divider } from '@mui/material';
import { Route as RouteIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, RestartAlt as ResetIcon } from '@mui/icons-material';
// @ts-ignore
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core } from 'cytoscape';
import type { Sahabi } from '../../types';
import { useTranslation } from 'react-i18next';

interface GraphCanvasProps {
  elements: any[];
  onNodeClick: (node: Sahabi) => void;
  cyRef: React.MutableRefObject<Core | null>;
  onShowConnections?: () => void;
  showConnectionsActive?: boolean;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  elements,
  onNodeClick,
  cyRef,
  onShowConnections,
  showConnectionsActive
}) => {
  const { t } = useTranslation();

  const stylesheet: any[] = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'background-color': '#666',
        'color': '#000',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '10px',
        'width': '40px',
        'height': '40px',
      }
    },
    {
      selector: 'node[is_prophet = "True"]',
      style: {
        'shape': 'star',
        'background-color': '#ffd700',
        'color': '#000',
        'width': '80px',
        'height': '80px',
        'font-size': '30px',
        'text-valign': 'center',
        'label': '★'
      }
    },
    {
      selector: 'node[gender = "male"][is_prophet = "False"]',
      style: {
        'background-color': '#2196f3',
      }
    },
    {
      selector: 'node[gender = "female"]',
      style: {
        'background-color': '#e91e63',
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': '4px',
        'border-color': '#2e7d32',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#999',
        'target-arrow-color': '#999',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '8px',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'color': '#333',
        'text-background-opacity': 1,
        'text-background-color': 'rgba(255, 255, 255, 0.7)',
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle'
      }
    },
    {
      selector: '.highlighted',
      style: {
        'line-color': '#2e7d32',
        'target-arrow-color': '#2e7d32',
        'width': 4,
        'transition-property': 'line-color, width',
        'transition-duration': '0.5s'
      }
    }
  ];

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleReset = () => {
    cyRef.current?.fit();
    cyRef.current?.layout({ name: 'cose', animate: true }).run();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={stylesheet}
        cy={(cy: Core) => {
          cyRef.current = cy;
          cy.on('tap', 'node', (evt: any) => {
            const nodeData = evt.target.data();
            onNodeClick(nodeData as unknown as Sahabi);
          });
        }}
        layout={{ name: 'cose' }}
      />

      <Paper
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          p: 0.5,
          gap: 0.5,
          zIndex: 1000
        }}
      >
        <Tooltip title={t('show_connections')}>
          <IconButton
            color={showConnectionsActive ? "primary" : "default"}
            onClick={onShowConnections}
          >
            <RouteIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Zoom In">
          <IconButton onClick={handleZoomIn}><ZoomInIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton onClick={handleZoomOut}><ZoomOutIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Reset Layout">
          <IconButton onClick={handleReset}><ResetIcon /></IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default GraphCanvas;
