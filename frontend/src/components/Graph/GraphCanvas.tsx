import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Paper, IconButton, Tooltip, Divider, Menu, MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import {
  Route as RouteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  DeleteSweep as DeleteSweepIcon,
  Share as ShareIcon,
  TouchApp as TouchAppIcon,
  AccountTree as LayoutIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
// @ts-expect-error - cytoscape-svg lacks official type definitions
import svg from 'cytoscape-svg';
// @ts-expect-error - layout extensions lack official type definitions
import dagre from 'cytoscape-dagre';
// @ts-expect-error - layout extensions lack official type definitions
import klay from 'cytoscape-klay';
// @ts-expect-error - layout extensions lack official type definitions
import cola from 'cytoscape-cola';
// @ts-expect-error - layout extensions lack official type definitions
import euler from 'cytoscape-euler';
import type { Core } from 'cytoscape';
import type { Sahabi } from '../../types';
import { useTranslation } from 'react-i18next';

// Register Cytoscape extensions
cytoscape.use(svg);
cytoscape.use(dagre);
cytoscape.use(klay);
cytoscape.use(cola);
cytoscape.use(euler);

interface GraphCanvasProps {
  elements: cytoscape.ElementDefinition[];
  onNodeClick: (node: Sahabi) => void;
  cyRef: React.MutableRefObject<Core | null>;
  onShowConnections?: () => void;
  showConnectionsActive?: boolean;
  onDeleteSelectedNodes?: (nodeIds: string[]) => void;
  onRemoveAll?: () => void;
  onShare?: () => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  elements,
  onNodeClick,
  cyRef,
  onShowConnections,
  showConnectionsActive,
  onDeleteSelectedNodes,
  onRemoveAll,
  onShare
}) => {
  const { t } = useTranslation();
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [layoutType, setLayoutType] = useState<string>('cose');
  const [layoutAnchorEl, setLayoutAnchorEl] = useState<null | HTMLElement>(null);
  const multiSelectModeRef = useRef(false);
  const selectNodeRef = useRef<((cy: Core, evt: cytoscape.EventObject) => void) | null>(null);

  const layouts = [
    { value: 'cose', label: 'Force-Directed (COSE)', description: 'Physics-based, automatic spacing' },
    { value: 'breadthfirst', label: 'Tree/Hierarchy', description: 'Top-down tree structure' },
    { value: 'circle', label: 'Circle', description: 'Nodes arranged in a circle' },
    { value: 'concentric', label: 'Concentric', description: 'Concentric circles by importance' },
    { value: 'grid', label: 'Grid', description: 'Nodes in a grid pattern' },
    { value: 'random', label: 'Random', description: 'Random positioning' },
    { value: 'dagre', label: 'Dagre', description: 'Directed graph layout (requires extension)' },
    { value: 'klay', label: 'KLay', description: 'Advanced hierarchical layout (requires extension)' },
    { value: 'cola', label: 'Cola', description: 'Constraint-based layout (requires extension)' },
    { value: 'euler', label: 'Euler', description: 'Force-directed with compound nodes (requires extension)' }
  ];
  const onNodeClickRef = useRef(onNodeClick);
  const selectedNodeIdsRef = useRef<string[]>([]); // Track selected node IDs across re-renders

  // Keep refs in sync
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Keep ref in sync with state
  useEffect(() => {
    multiSelectModeRef.current = multiSelectMode;
    console.log('Multi-select mode changed to:', multiSelectMode);
    
    // When disabling multi-select, clear the stored selections
    // so auto-restoration doesn't keep them alive
    if (!multiSelectMode) {
      selectedNodeIdsRef.current = [];
      console.log('🧹 Cleared selectedNodeIdsRef (multi-select mode disabled)');
      
      // Also clear any selections and their visual styles from the graph
      const cy = cyRef.current;
      if (cy) {
        const selectedNodes = cy.$(':selected');
        selectedNodes.forEach((n) => {
          n.unselect();
          // Remove inline border styles
          n.removeStyle('border-width border-color border-style');
        });
        console.log('🧹 Cleared', selectedNodes.length, 'selections when disabling multi-select');
      }
    }
  }, [multiSelectMode]);

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

    // Save currently selected node IDs BEFORE layout
    const selectedIds = cy.$('node:selected').map((node) => node.id());
    console.log('💾 Preserving selection before layout:', selectedIds);

    // Run layout with animation for better visual experience
    const layoutConfig: any = {
      name: layoutType,
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 50
    };

    // Add layout-specific options
    if (layoutType === 'cose') {
      Object.assign(layoutConfig, {
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
    } else if (layoutType === 'breadthfirst') {
      Object.assign(layoutConfig, {
        directed: true,
        spacingFactor: 1.5,
        avoidOverlap: true
      });
    } else if (layoutType === 'concentric') {
      Object.assign(layoutConfig, {
        concentric: (node: cytoscape.NodeSingular) => node.degree(),
        levelWidth: () => 2,
        minNodeSpacing: 50
      });
    } else if (layoutType === 'grid') {
      Object.assign(layoutConfig, {
        avoidOverlap: true,
        avoidOverlapPadding: 10
      });
    } else if (layoutType === 'dagre') {
      Object.assign(layoutConfig, {
        rankDir: 'TB',
        nodeSep: 50,
        rankSep: 100
      });
    } else if (layoutType === 'klay') {
      Object.assign(layoutConfig, {
        direction: 'DOWN',
        spacing: 50,
        thoroughness: 7
      });
    } else if (layoutType === 'cola') {
      Object.assign(layoutConfig, {
        avoidOverlap: true,
        nodeSpacing: 50,
        edgeLength: 100
      });
    } else if (layoutType === 'euler') {
      Object.assign(layoutConfig, {
        springLength: 100,
        springCoeff: 0.0008,
        mass: 4,
        gravity: -1.2,
        pull: 0.001
      });
    }

    const layout = cy.layout(layoutConfig);
    
    // After layout completes, restore selections
    layout.on('layoutstop', () => {
      selectedIds.forEach((id) => {
        const node = cy.$(`#${id}`);
        if (node.length > 0) {
          node.select();
        }
      });
      if (selectedIds.length > 0) {
        console.log('♻️ Restored selection after layout:', selectedIds);
        // Force style update to ensure overlay appears
        cy.style().update();
        
        // Also apply inline styles
        selectedIds.forEach((id) => {
          const node = cy.$(`#${id}`);
          if (node.length > 0) {
            node.style('border-width', '4px');
            node.style('border-color', '#2e7d32');
            node.style('border-style', 'solid');
          }
        });
        cy.forceRender();
      }
      
      // Update the ref with current selections
      selectedNodeIdsRef.current = selectedIds;
    });
    
    layout.run();
  }, [elements, cyRef, layoutType]);

  // Restore selections whenever elements change (after layout)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    
    console.log('🔍 Restoration useEffect triggered. Elements count:', elements.length);
    
    // Delay restoration to let layout finish first
    const timer = setTimeout(() => {
      if (selectedNodeIdsRef.current.length > 0) {
        console.log('🔄 Restoring selections from ref:', selectedNodeIdsRef.current);
        selectedNodeIdsRef.current.forEach((id) => {
          const node = cy.$(`#${id}`);
          if (node.length > 0 && !node.selected()) {
            node.select();
            // Apply inline styles too
            node.style('border-width', '4px');
            node.style('border-color', '#2e7d32');
            node.style('border-style', 'solid');
          }
        });
        cy.forceRender();
        console.log('✅ Selections restored, current count:', cy.$('node:selected').length);
      }
    }, 600); // After layout animation (500ms) + buffer
    
    return () => clearTimeout(timer);
  }, [elements, cyRef]);

  // ADDITIONAL: Continuously monitor and restore selections every 100ms in multi-select mode
  useEffect(() => {
    if (!multiSelectMode) return;
    
    const cy = cyRef.current;
    if (!cy) return;
    
    const intervalId = setInterval(() => {
      if (selectedNodeIdsRef.current.length > 0) {
        const currentSelectedCount = cy.$('node:selected').length;
        const expectedCount = selectedNodeIdsRef.current.length;
        
        if (currentSelectedCount !== expectedCount) {
          console.log('⚠️ Selection mismatch detected! Expected:', expectedCount, 'Current:', currentSelectedCount);
          console.log('🔧 Auto-restoring selections...');
          
          // Restore selections
          selectedNodeIdsRef.current.forEach((id) => {
            const node = cy.$(`#${id}`);
            if (node.length > 0 && !node.selected()) {
              node.select();
              node.style('border-width', '4px');
              node.style('border-color', '#2e7d32');
              node.style('border-style', 'solid');
            }
          });
          cy.forceRender();
          console.log('✅ Auto-restored. Current count:', cy.$('node:selected').length);
        }
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(intervalId);
  }, [multiSelectMode, cyRef]);

  const isMultiSelectGesture = useCallback((evt: cytoscape.EventObject): boolean => {
    const originalEvent = evt.originalEvent as MouseEvent | KeyboardEvent | undefined;
    return Boolean(
      multiSelectModeRef.current || (originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey || originalEvent.shiftKey))
    );
  }, []); // No dependencies - uses ref which is always current

  const selectNode = useCallback((cy: Core, evt: cytoscape.EventObject) => {
    const node = evt.target;
    const isMulti = isMultiSelectGesture(evt);
    
    console.log('========== NODE CLICKED ==========');
    console.log('Node ID:', node.id());
    console.log('Node label:', node.data('label'));
    console.log('isMulti from gesture:', isMulti);
    console.log('multiSelectModeRef.current:', multiSelectModeRef.current);
    console.log('node.selected() BEFORE:', node.selected());
    
    if (isMulti) {
      if (node.selected()) {
        node.unselect();
        console.log('➖ Node DESELECTED (multi-select ON)');
      } else {
        node.select();
        console.log('➕ Node SELECTED (multi-select ON)');
      }
      console.log('node.selected() AFTER:', node.selected());
      console.log('Total selected nodes:', cy.$('node:selected').length);
      console.log('NOT calling onNodeClick (multi-select mode)');
      
      // Get all currently selected nodes BEFORE any async operations
      const selectedNodes = cy.$('node:selected');
      selectedNodes.forEach((n) => {
        console.log('   - Selected node:', n.id(), n.data('label'));
      });
      
      // Store selected node IDs in ref for persistence across re-renders
      selectedNodeIdsRef.current = selectedNodes.map((n) => n.id());
      console.log('💾 Stored selected IDs in ref:', selectedNodeIdsRef.current);
      
      // Force Cytoscape to re-render ALL selected nodes with their border styles
      // Apply styles IMMEDIATELY (no setTimeout) to avoid race conditions
      selectedNodes.forEach((n) => {
        n.style('border-width', '4px');
        n.style('border-color', '#2e7d32');
        n.style('border-style', 'solid');
      });
      console.log('🎨 Forced visual style update on', selectedNodes.length, 'selected nodes');
      
      // Force a redraw
      cy.forceRender();
      
      // In multi-select mode, don't call onNodeClick to avoid triggering parent re-renders
      // that might interfere with selection state
    } else {
      cy.$(':selected').not(node).unselect();
      node.select();
      console.log('🔄 Single select (cleared others)');
      console.log('Total selected nodes:', cy.$('node:selected').length);
      
      // Only call onNodeClick in single-select mode, using ref
      const nodeData = node.data();
      if (onNodeClickRef.current) {
        console.log('Calling onNodeClick');
        onNodeClickRef.current(nodeData as unknown as Sahabi);
      }
    }
    
    // Force Cytoscape to update the visual styles after selection change
    // This ensures the green border appears immediately
    cy.style().update();
    
    console.log('==================================');
  }, [isMultiSelectGesture]); // Removed onNodeClick dependency - uses ref instead

  // Store selectNode in ref so it's accessible in event handlers
  useEffect(() => {
    selectNodeRef.current = selectNode;
    
    // Re-attach event listeners when selectNode changes and cy is ready
    const cy = cyRef.current;
    if (!cy) return;

    // Remove old listeners
    cy.removeListener('tap', 'node');
    cy.removeListener('cxttap', 'node');
    cy.removeListener('tap'); // Remove background tap listeners too

    // Attach new listeners with current selectNode via ref
    cy.on('tap', 'node', (evt: cytoscape.EventObject) => {
      if (selectNodeRef.current) {
        selectNodeRef.current(cy, evt);
      }
    });

    // On macOS, Ctrl+click can be emitted as context-tap. Handle it as multi-select.
    cy.on('cxttap', 'node', (evt: cytoscape.EventObject) => {
      evt.originalEvent?.preventDefault?.();
      if (selectNodeRef.current) {
        selectNodeRef.current(cy, evt);
      }
    });

    // Prevent background taps from clearing selections in multi-select mode
    cy.on('tap', (evt: cytoscape.EventObject) => {
      // Only handle background taps (when target is the core, not a node)
      if (evt.target === cy) {
        if (multiSelectModeRef.current) {
          // In multi-select mode, don't clear selections when clicking background
          evt.stopPropagation();
          console.log('🚫 Background tap - preserving selections in multi-select mode');
        } else {
          // In single-select mode, clear all selections when clicking background
          const selectedNodes = cy.$(':selected');
          selectedNodes.forEach((n) => {
            n.unselect();
            // Remove inline border styles that were applied
            n.removeStyle('border-width border-color border-style');
          });
          selectedNodeIdsRef.current = []; // Clear the ref too!
          console.log('🧹 Background tap - cleared all selections (single-select mode)');
        }
      }
    });
  }, [selectNode]);

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
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 10,
        'font-size': '11px',
        'font-weight': 'bold',
        'text-background-color': 'rgba(255, 255, 255, 0.95)',
        'text-background-opacity': 1,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
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
        'background-image': () => {
          return 'data:image/svg+xml;utf8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
              <text x="30" y="40" font-size="32" fill="white" text-anchor="middle" font-family="Arial">🛡️</text>
            </svg>`
          );
        },
        'background-width': '60px',
        'background-height': '60px',
        'label': 'data(label)',
        'color': '#000',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 12,
        'font-size': '10px',
        'font-weight': 'bold',
        'text-background-color': 'rgba(255, 255, 255, 0.95)',
        'text-background-opacity': 1,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        'width': '60px',
        'height': '60px',
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': '4px',
        'border-color': '#2e7d32',
        'border-style': 'solid',
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
    <Box id="tour-graph-canvas" sx={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={stylesheet}
          cy={(cy: Core) => {
            cyRef.current = cy;
            window.cy = cy;
            
            // ENABLE selection (false means selectable)
            cy.autounselectify(false);
            
            // Enable box selection for multi-select via drag
            cy.boxSelectionEnabled(true);
            
            // Log for debugging
            console.log('✅ Cytoscape initialized - selection ENABLED');
          }}
          layout={{ name: 'cose' }}
        />
      </Box>

      <Box 
        sx={{ 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: { xs: 1, sm: 1.5, md: 2 },
          px: 1,
          bgcolor: 'transparent',
          pointerEvents: 'none'
        }}
      >
        <Paper
          id="tour-graph-controls"
          sx={{
            display: 'flex',
            flexWrap: { xs: 'wrap', sm: 'wrap', md: 'nowrap' },
            p: 0.5,
            gap: 0.5,
            zIndex: 1000,
            maxWidth: { xs: '100%', sm: '90%', md: 'none' },
            justifyContent: 'center',
            boxShadow: 3,
            pointerEvents: 'auto'
          }}
        >
        <Tooltip title={multiSelectMode ? t('multi_select_on', { defaultValue: 'Multi-Select: ON (tap to disable)' }) : t('multi_select_off', { defaultValue: 'Multi-Select: OFF (tap to enable)' })}>
          <IconButton
            id="tour-multi-select"
            color={multiSelectMode ? "primary" : "default"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMultiSelectMode(prev => {
                const newMode = !prev;
                console.log('🔘 Multi-select button clicked! New mode:', newMode);
                return newMode;
              });
            }}
            sx={{
              bgcolor: multiSelectMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                bgcolor: multiSelectMode ? 'rgba(33, 150, 243, 0.35)' : 'rgba(0, 0, 0, 0.08)'
              },
              border: multiSelectMode ? '3px solid #2196f3' : '2px solid rgba(0, 0, 0, 0.12)',
              transition: 'all 0.3s ease',
              boxShadow: multiSelectMode ? '0 0 8px rgba(33, 150, 243, 0.4)' : 'none'
            }}
          >
            <TouchAppIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={t('show_connections')}>
          <IconButton
            id="tour-show-connections"
            color={showConnectionsActive ? "primary" : "default"}
            onClick={onShowConnections}
          >
            <RouteIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={t('change_layout', { defaultValue: 'Change Layout' })}>
          <IconButton
            onClick={(e) => setLayoutAnchorEl(e.currentTarget)}
            color={layoutAnchorEl ? 'primary' : 'default'}
          >
            <LayoutIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={layoutAnchorEl}
          open={Boolean(layoutAnchorEl)}
          onClose={() => setLayoutAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {layouts.map((layout) => (
            <MenuItem
              key={layout.value}
              onClick={() => {
                setLayoutType(layout.value);
                setLayoutAnchorEl(null);
              }}
              selected={layoutType === layout.value}
            >
              {layoutType === layout.value && (
                <ListItemIcon>
                  <CheckIcon fontSize="small" />
                </ListItemIcon>
              )}
              <ListItemText
                primary={layout.label}
                secondary={layout.description}
                sx={{ pl: layoutType === layout.value ? 0 : 4 }}
              />
            </MenuItem>
          ))}
        </Menu>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={t('zoom_in')}>
          <IconButton id="tour-zoom-in" onClick={handleZoomIn}><ZoomInIcon /></IconButton>
        </Tooltip>
        <Tooltip title={t('zoom_out')}>
          <IconButton id="tour-zoom-out" onClick={handleZoomOut}><ZoomOutIcon /></IconButton>
        </Tooltip>
        <Tooltip title={t('reset_layout')}>
          <IconButton id="tour-reset-layout" onClick={handleReset}><ResetIcon /></IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={t('remove_all')}>
          <IconButton id="tour-remove-all" onClick={onRemoveAll} color="error">
            <DeleteSweepIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={t('export_png')}>
          <IconButton id="tour-export-png" onClick={handleExportPNG}><ImageIcon /></IconButton>
        </Tooltip>
        <Tooltip title={t('export_svg')}>
          <IconButton id="tour-export-svg" onClick={handleExportSVG}><DownloadIcon /></IconButton>
        </Tooltip>
        {onShare && (
          <>
            <Divider orientation="vertical" flexItem />
            <Tooltip title={t('share_graph', { defaultValue: 'Share Graph' })}>
              <IconButton id="tour-share" onClick={onShare} color="primary">
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Paper>

    </Box>
  );
};

export default GraphCanvas;
