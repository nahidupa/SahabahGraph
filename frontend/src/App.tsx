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
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Female as FemaleIcon,
  Add as AddIcon,
} from '@mui/icons-material';
// @ts-ignore
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core } from 'cytoscape';
import type { GraphData, Sahabi } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<GraphData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Sahabi | null>(null);
  const [elements, setElements] = useState<any[]>([]);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    fetch('./data/sahabah_data.json')
      .then((res) => res.json())
      .then((json: GraphData) => {
        setData(json);
        // Initial element: The Prophet (PBUH)
        const prophet = json.nodes.find(n => n.id === 0);
        if (prophet) {
          setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name, originalId: prophet.id } }]);
        }
      });
  }, []);

  const filteredNodes = useMemo(() => {
    if (!data) return [];
    return data.nodes.filter(n =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const addNodeToGraph = (node: Sahabi) => {
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
        // Add node
        newElements.push({ data: { ...otherNode, id: otherNode.id.toString(), label: otherNode.name, originalId: otherNode.id } });
        // Add edge
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

    // Trigger layout after adding elements
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.layout({ name: 'cose', animate: true }).run();
      }
    }, 100);
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
          {filteredNodes.map((node) => (
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
              setSelectedNode(nodeData as unknown as Sahabi);
            });
          }}
          layout={{ name: 'cose' }}
        />
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
                <Avatar sx={{ bgcolor: selectedNode.is_prophet === "True" ? '#ffd700' : (selectedNode.gender === 'male' ? '#2196f3' : '#e91e63'), mr: 2 }}>
                  {selectedNode.is_prophet === "True" ? <StarIcon /> : (selectedNode.gender === 'male' ? <PersonIcon /> : <FemaleIcon />)}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedNode.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">{selectedNode.title}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Expand Relationships</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Click to reveal connections:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['sons', 'daughters', 'uncles', 'others'].map((cat) => (
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
                  This section could contain a brief biography or historical notes about {selectedNode.name}.
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">Select a node to view details</Typography>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default App;
