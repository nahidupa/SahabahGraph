import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  Avatar,
  Chip,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Female as FemaleIcon,
  Add as AddIcon,
  Route as PathIcon,
  Clear as ClearIcon,
  Event as EventIcon
} from '@mui/icons-material';
// @ts-ignore
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core } from 'cytoscape';
import Fuse from 'fuse.js';
import type { GraphData } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<GraphData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [elements, setElements] = useState<any[]>([]);
  const [pathSource, setPathSource] = useState<any | null>(null);
  const [pathTarget, setPathTarget] = useState<any | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    fetch('./data/sahabah_data.json')
      .then((res) => res.json())
      .then((json: GraphData) => {
        setData(json);
        const prophet = json.nodes.find(n => n.id === 0);
        if (prophet) {
          setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name, originalId: prophet.id } }]);
        }
      });
  }, []);

  const fuse = useMemo(() => {
    if (!data) return null;
    return new Fuse(data.nodes, {
      keys: ['name', 'title'],
      threshold: 0.3
    });
  }, [data]);

  const filteredNodes = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.nodes.slice(0, 50);
    if (!fuse) return data.nodes.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return fuse.search(searchTerm).map(result => result.item);
  }, [data, searchTerm, fuse]);

  const addNodeToGraph = (node: any) => {
    setElements((prev) => {
      const exists = prev.find(el => el.data.id === node.id.toString());
      if (exists) return prev;
      return [...prev, { data: { ...node, id: node.id.toString(), label: node.name, originalId: node.id } }];
    });
  };

  const expandRelationships = (nodeId: number, category: string) => {
    if (!data) return;
    const rels = data.links.filter(l =>
      (l.source_id === nodeId || l.target_id === nodeId) &&
      l.category === category
    );

    const newElements: any[] = [];
    rels.forEach(rel => {
      const otherId = rel.source_id === nodeId ? rel.target_id : rel.source_id;
      const otherNode = data.nodes.find(n => n.id === otherId);
      if (otherNode) {
        newElements.push({ data: { ...otherNode, id: otherNode.id.toString(), label: otherNode.name, originalId: otherNode.id } });
        newElements.push({
          data: {
            id: `e${rel.source_id}-${rel.target_id}`,
            source: rel.source_id.toString(),
            target: rel.target_id.toString(),
            label: rel.type
          }
        });
      }
    });

    setElements((prev) => {
      const existingIds = new Set(prev.map(el => el.data.id));
      const filteredNew = newElements.filter(el => !existingIds.has(el.data.id));
      return [...prev, ...filteredNew];
    });

    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.layout({ name: 'cose', animate: true }).run();
      }
    }, 100);
  };

  const findPath = () => {
    if (!pathSource || !pathTarget || !data) return;

    const queue: [number, number[]][] = [[pathSource.id, []]];
    const visited = new Set<number>();
    visited.add(pathSource.id);

    let foundPath: number[] | null = null;

    while (queue.length > 0) {
      const [currId, path] = queue.shift()!;
      if (currId === pathTarget.id) {
        foundPath = [...path, currId];
        break;
      }

      const neighbors = data.links
        .filter(l => l.source_id === currId || l.target_id === currId)
        .map(l => l.source_id === currId ? l.target_id : l.source_id);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, currId]]);
        }
      }
    }

    if (foundPath) {
      const pathElements: any[] = [];
      for (let i = 0; i < foundPath.length; i++) {
        const node = data.nodes.find(n => n.id === foundPath![i])!;
        pathElements.push({ data: { ...node, id: node.id.toString(), label: node.name, originalId: node.id } });

        if (i < foundPath.length - 1) {
          const s = foundPath[i];
          const t = foundPath[i+1];
          const rel = data.links.find(l => (l.source_id === s && l.target_id === t) || (l.source_id === t && l.target_id === s))!;
          pathElements.push({
            data: {
              id: `e${rel.source_id}-${rel.target_id}`,
              source: rel.source_id.toString(),
              target: rel.target_id.toString(),
              label: rel.type
            }
          });
        }
      }

      setElements((prev) => {
        const existingIds = new Set(prev.map(el => el.data.id));
        const filteredNew = pathElements.filter(el => !existingIds.has(el.data.id));
        return [...prev, ...filteredNew];
      });

      setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.elements().removeClass('highlighted');
          foundPath!.forEach((id, i) => {
            cyRef.current?.$(`#${id}`).addClass('highlighted');
            if (i < foundPath!.length - 1) {
              const s = foundPath![i];
              const t = foundPath![i+1];
              cyRef.current?.$(`edge[source="${s}"][target="${t}"], edge[source="${t}"][target="${s}"]`).addClass('highlighted');
            }
          });
          cyRef.current.layout({ name: 'cose', animate: true }).run();
        }
      }, 200);
    } else {
      alert("No path found between these two entities.");
    }
  };

  const stylesheet: any[] = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'background-color': '#666',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '10px',
        'width': '40px',
        'height': '40px',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.5s'
      }
    },
    {
      selector: 'node[type = "event"]',
      style: {
        'shape': 'hexagon',
        'background-color': '#795548',
        'width': '50px',
        'height': '50px',
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
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#999',
        'target-arrow-color': '#999',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'color': '#333',
        'text-background-opacity': 1,
        'text-background-color': '#fff',
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle'
      }
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': '#ff9800',
        'line-color': '#ff9800',
        'target-arrow-color': '#ff9800',
        'width': 4
      }
    }
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 300,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>SahabahGraph</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search Sahabah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }
            }}
          />
        </Box>
        <Divider />
        <List sx={{ overflowY: 'auto' }}>
          {filteredNodes.map((node: any) => (
            <ListItem
              key={node.id}
              component="div"
              disablePadding
              secondaryAction={
                <IconButton edge="end" onClick={() => addNodeToGraph(node)}>
                  <AddIcon />
                </IconButton>
              }
            >
              <Button
                fullWidth
                sx={{ textAlign: 'left', justifyContent: 'flex-start', color: 'inherit', textTransform: 'none' }}
                onClick={() => setSelectedNode(node)}
              >
                <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: node.type === 'event' ? '#795548' : (node.gender === 'male' ? '#2196f3' : '#e91e63'), fontSize: 12 }}>
                   {node.type === 'event' ? <EventIcon sx={{ fontSize: 16 }} /> : (node.gender === 'male' ? 'M' : 'F')}
                </Avatar>
                <ListItemText primary={node.name} secondary={node.title} />
              </Button>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#fafafa' }}>
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={stylesheet}
          cy={(cy: Core) => {
            cyRef.current = cy;
            cy.on('tap', 'node', (evt: any) => {
              const nodeData = evt.target.data();
              setSelectedNode(nodeData);
            });
          }}
          layout={{ name: 'cose' }}
        />

        <Paper elevation={3} sx={{ position: 'absolute', top: 16, left: 16, p: 2, display: 'flex', gap: 1, alignItems: 'center', zIndex: 1000 }}>
          <Tooltip title="Source Node">
            <Chip
              label={pathSource?.name || "Select Source"}
              color={pathSource ? "primary" : "default"}
              onClick={() => selectedNode && setPathSource(selectedNode)}
              onDelete={pathSource ? () => setPathSource(null) : undefined}
            />
          </Tooltip>
          <PathIcon color="action" />
          <Tooltip title="Target Node">
            <Chip
              label={pathTarget?.name || "Select Target"}
              color={pathTarget ? "secondary" : "default"}
              onClick={() => selectedNode && setPathTarget(selectedNode)}
              onDelete={pathTarget ? () => setPathTarget(null) : undefined}
            />
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            onClick={findPath}
            disabled={!pathSource || !pathTarget}
            startIcon={<PathIcon />}
          >
            Find Path
          </Button>
          <IconButton size="small" onClick={() => { setPathSource(null); setPathTarget(null); cyRef.current?.elements().removeClass('highlighted'); }}>
            <ClearIcon />
          </IconButton>
        </Paper>
      </Box>

      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: 350,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 350, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ p: 3 }}>
          {selectedNode ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: selectedNode.is_prophet === "True" ? '#ffd700' : (selectedNode.type === 'event' ? '#795548' : (selectedNode.gender === 'male' ? '#2196f3' : '#e91e63')), mr: 2 }}>
                  {selectedNode.is_prophet === "True" ? <StarIcon /> : (selectedNode.type === 'event' ? <EventIcon /> : (selectedNode.gender === 'male' ? <PersonIcon /> : <FemaleIcon />))}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedNode.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">{selectedNode.title}</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => setPathSource(selectedNode)}>Set as Source</Button>
                <Button size="small" variant="outlined" onClick={() => setPathTarget(selectedNode)}>Set as Target</Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Expand Relationships</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['sons', 'daughters', 'uncles', 'others', 'events'].map((cat) => (
                  <Chip
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    onClick={() => expandRelationships(selectedNode.id, cat)}
                    icon={<AddIcon />}
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                ))}
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography variant="body1">
                  Historical details for {selectedNode.name}.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Type: {selectedNode.type} | ID: {selectedNode.id}
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">Select an entity to view details</Typography>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default App;
