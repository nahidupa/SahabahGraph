import React, { useState, useMemo } from 'react';
import { Box, Paper, IconButton, Tooltip, Divider, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import {
  Route as RouteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Add as AddIcon
} from '@mui/icons-material';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
// @ts-expect-error - cytoscape-svg lacks official type definitions
import svg from 'cytoscape-svg';
import type { Core } from 'cytoscape';
import type { Sahabi, Relationship } from '../../types';
import { useTranslation } from 'react-i18next';

interface GraphCanvasProps {
  elements: cytoscape.ElementDefinition[];
  onNodeClick: (node: Sahabi) => void;
  cyRef: React.MutableRefObject<Core | null>;
  onShowConnections?: () => void;
  showConnectionsActive?: boolean;
  links?: Relationship[];
  onExpand?: (nodeId: number, categoryOrType: string) => void;
}

if (typeof cytoscape('core', 'svg') !== 'function') {
  cytoscape.use(svg);
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  elements,
  onNodeClick,
  cyRef,
  onShowConnections,
  showConnectionsActive,
  links = [],
  onExpand
}) => {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    nodeId: number;
  } | null>(null);

  const availableRelTypes = useMemo(() => {
    if (!contextMenu || !links) return [];
    const nodeRels = links.filter(l => l.source_id === contextMenu.nodeId || l.target_id === contextMenu.nodeId);
    const types = new Set<string>();
    nodeRels.forEach(r => types.add(r.type));
    return Array.from(types);
  }, [contextMenu, links]);

  const handleContextMenu = (event: cytoscape.EventObject) => {
    event.preventDefault();
    // @ts-expect-error - originalEvent might exist and have preventDefault
    event.originalEvent?.preventDefault();
    const node = event.target;
    const nodeId = parseInt(node.id());
    const position = event.renderedPosition;

    // Get the container's position to offset the menu correctly
    const container = cyRef.current?.container();
    if (container) {
      const rect = container.getBoundingClientRect();
      setContextMenu({
        mouseX: rect.left + position.x,
        mouseY: rect.top + position.y,
        nodeId: nodeId,
      });
    }
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleExpand = (type: string) => {
    if (onExpand && contextMenu) {
      onExpand(contextMenu.nodeId, type);
    }
    handleClose();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      selector: 'node[node_type = "Battle"]',
      style: {
        'shape': 'diamond',
        'background-color': '#795548',
        'color': '#fff',
        'width': '60px',
        'height': '60px',
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
      selector: 'node.highlighted',
      style: {
        'border-width': '6px',
        'border-color': '#ff9800',
        'width': '50px',
        'height': '50px',
        'transition-property': 'border-width, border-color, width, height',
        'transition-duration': '0.3s'
      }
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#ff9800',
        'target-arrow-color': '#ff9800',
        'width': 6,
        'transition-property': 'line-color, width',
        'transition-duration': '0.3s'
      }
    }
  ];

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleReset = () => {
    cyRef.current?.fit();
    cyRef.current?.layout({ name: 'cose', animate: true }).run();
  };

  const handleExportPNG = () => {
    if (!cyRef.current) return;
    const png64 = cyRef.current.png({ full: true, bg: '#ffffff' });
    const link = document.createElement('a');
    link.href = png64;
    link.download = 'sahabah-graph.png';
    link.click();
  };

  const handleExportSVG = () => {
    if (!cyRef.current) return;
    // @ts-expect-error - cytoscape-svg extension adds .svg() to cy
    const svgContent = (cyRef.current as { svg: (options: Record<string, unknown>) => string }).svg({ full: true, bg: '#ffffff' });
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sahabah-graph.svg';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={stylesheet}
        cy={(cy: Core) => {
          cyRef.current = cy;
          window.cy = cy;
          cy.on('tap', 'node', (evt: cytoscape.EventObject) => {
            const nodeData = evt.target.data();
            onNodeClick(nodeData as unknown as Sahabi);
          });
          cy.on('cxttap', 'node', handleContextMenu);
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
        <Divider orientation="vertical" flexItem />
        <Tooltip title={t('export_png')}>
          <IconButton onClick={handleExportPNG}><ImageIcon /></IconButton>
        </Tooltip>
        <Tooltip title={t('export_svg')}>
          <IconButton onClick={handleExportSVG}><DownloadIcon /></IconButton>
        </Tooltip>
      </Paper>

      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('expand_relationships')}
          </Typography>
        </Box>
        <Divider />
        {availableRelTypes.length > 0 ? (
          availableRelTypes.map((type) => (
            <MenuItem key={type} onClick={() => handleExpand(type)}>
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {t(`relationships.${type}`, { defaultValue: type })}
              </ListItemText>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <ListItemText>{t('no_rels_found')}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default GraphCanvas;
