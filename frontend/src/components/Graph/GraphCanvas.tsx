import React, { useEffect } from 'react';
import { Box, Paper, IconButton, Tooltip, Divider } from '@mui/material';
import {
  Route as RouteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Download as DownloadIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
// @ts-expect-error - cytoscape-svg lacks official type definitions
import svg from 'cytoscape-svg';
import type { Core } from 'cytoscape';
import type { Sahabi } from '../../types';
import { useTranslation } from 'react-i18next';

interface GraphCanvasProps {
  elements: cytoscape.ElementDefinition[];
  onNodeClick: (node: Sahabi) => void;
  cyRef: React.MutableRefObject<Core | null>;
  onShowConnections?: () => void;
  showConnectionsActive?: boolean;
  onDeleteSelectedNodes?: (nodeIds: string[]) => void;
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
  onDeleteSelectedNodes
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!onDeleteSelectedNodes) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? '';
      const isTypingContext =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable === true;
      if (isTypingContext) return;

      const cy = cyRef.current;
      if (!cy) return;

      const selectedNodes = cy.$('node:selected');
      if (selectedNodes.length === 0) return;

      event.preventDefault();
      const selectedNodeIds = selectedNodes.map((node) => node.id());
      onDeleteSelectedNodes(selectedNodeIds);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cyRef, onDeleteSelectedNodes]);

  // Apply layout when elements change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || elements.length === 0) return;

    // Run layout with animation for better visual experience
    const layout = cy.layout({
      name: 'cose',
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 50,
      nodeRepulsion: 8000,
      idealEdgeLength: 100,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0
    });
    
    layout.run();
  }, [elements, cyRef]);

  const isMultiSelectGesture = (evt: cytoscape.EventObject): boolean => {
    const originalEvent = evt.originalEvent as MouseEvent | KeyboardEvent | undefined;
    return Boolean(
      originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey || originalEvent.shiftKey)
    );
  };

  const selectNode = (cy: Core, evt: cytoscape.EventObject) => {
    const node = evt.target;
    if (isMultiSelectGesture(evt)) {
      if (node.selected()) {
        node.unselect();
      } else {
        node.select();
      }
    } else {
      cy.$(':selected').not(node).unselect();
      node.select();
    }

    const nodeData = node.data();
    onNodeClick(nodeData as unknown as Sahabi);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stylesheet: any[] = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'background-color': '#666',
        'color': '#000',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 8,
        'font-size': '9px',
        'width': '50px',
        'height': '50px',
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'text-background-color': 'rgba(255, 255, 255, 0.9)',
        'text-background-opacity': 1,
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle',
      }
    },
    {
      selector: 'node[is_prophet = "true"]',
      style: {
        'shape': 'star',
        'background-color': '#ffd700',
        'color': '#000',
        'width': '80px',
        'height': '80px',
        'font-size': '40px',
        'text-valign': 'center',
        'text-margin-y': 0,
        'label': '★',
        'text-background-opacity': 0,
      }
    },
    {
      selector: 'node[gender = "male"][is_prophet = "false"]',
      style: {
        'background-color': '#2196f3',
        'background-image': () => {
          // Create text as "image" content centered in node
          return 'data:image/svg+xml;utf8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
              <text x="25" y="35" font-size="28" fill="white" text-anchor="middle" font-family="Arial">♂</text>
            </svg>`
          );
        },
        'background-width': '50px',
        'background-height': '50px',
        'width': '50px',
        'height': '50px',
      }
    },
    {
      selector: 'node[gender = "female"]',
      style: {
        'background-color': '#e91e63',
        'background-image': () => {
          return 'data:image/svg+xml;utf8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
              <text x="25" y="35" font-size="28" fill="white" text-anchor="middle" font-family="Arial">♀</text>
            </svg>`
          );
        },
        'background-width': '50px',
        'background-height': '50px',
        'width': '50px',
        'height': '50px',
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
        'transition-duration': '0.3s',
        'z-index': 9999
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
    try {
      // @ts-expect-error - cytoscape-svg extension adds .svg() to cy
      const svgContent = (cyRef.current as { svg: (options: Record<string, unknown>) => string }).svg({
        full: true,
        bg: '#ffffff',
        drawSelection: false
      });
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sahabah-graph-${new Date().toISOString().split('T')[0]}.svg`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to export SVG:', error);
      alert(t('export_failed'));
    }
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
            selectNode(cy, evt);
          });

          // On macOS, Ctrl+click can be emitted as context-tap. Handle it as multi-select.
          cy.on('cxttap', 'node', (evt: cytoscape.EventObject) => {
            evt.originalEvent?.preventDefault?.();
            selectNode(cy, evt);
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
        <Tooltip title={t('zoom_in')}>
          <IconButton onClick={handleZoomIn}><ZoomInIcon /></IconButton>
        </Tooltip>
        <Tooltip title={t('zoom_out')}>
          <IconButton onClick={handleZoomOut}><ZoomOutIcon /></IconButton>
        </Tooltip>
        <Tooltip title={t('reset_layout')}>
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

    </Box>
  );
};

export default GraphCanvas;
