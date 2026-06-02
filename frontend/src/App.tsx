import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
// i18n import for side-effects
import type { Core } from 'cytoscape';
import type { GraphData, PoliticalData, Sahabi } from './types';
import MainLayout from './components/Layout/MainLayout';
import SahabahSidebar from './components/Sidebar/SahabahSidebar';
import GraphCanvas from './components/Graph/GraphCanvas';
import TimelineView from './components/Timeline/TimelineView';
import PoliticalView from './components/Political/PoliticalView';
import SahabahDetail from './components/DetailPanel/SahabahDetail';
import PathSummary from './components/Graph/PathSummary';
import OnboardingTour from './components/Tour/OnboardingTour';
import AIChatPanel from './components/AIChat/AIChatPanelEnhanced';
import './i18n/config';
import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup, Box as MuiBox, Snackbar } from '@mui/material';
import { AccountTree as GraphIcon, ViewTimeline as TimelineIcon, Public as PublicIcon } from '@mui/icons-material';
import { generateShareUrl, readShareUrl, copyToClipboard } from './utils/shareGraph';

const GET_SAHABAH = gql`
  query GetSahabah {
    sahabis {
      id
      name_ar
      name_en
      kunyah
      laqab
      gender
      is_prophet
      prominence
      biography_short
      biography_source
      tribe
      clan
      birth_year_hijri
      death_year_hijri
    }
  }
`;

const DATA_FILE = 'data/sahabah_data.json';
const POLITICAL_DATA_FILE = 'data/political_terms.json';

const normalizeNodeId = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : -1;
};

const normalizeProphetFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const loadGraphData = async (): Promise<GraphData> => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const candidateUrls = Array.from(new Set([
    `./${DATA_FILE}`,
    `/${DATA_FILE}`,
    `${normalizedBase}${DATA_FILE}`,
  ]));

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }

      const json = (await response.json()) as GraphData;
      if (Array.isArray(json.nodes) && Array.isArray(json.links)) {
        return json;
      }
    } catch {
      // Try next candidate URL.
    }
  }

  throw new Error('Unable to load sahabah graph data');
};

const loadPoliticalData = async (): Promise<PoliticalData> => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const candidateUrls = Array.from(new Set([
    `./${POLITICAL_DATA_FILE}`,
    `/${POLITICAL_DATA_FILE}`,
    `${normalizedBase}${POLITICAL_DATA_FILE}`,
  ]));

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }

      const json = (await response.json()) as PoliticalData;
      if (Array.isArray(json.cities) && Array.isArray(json.terms)) {
        return json;
      }
    } catch {
      // Try next candidate URL.
    }
  }

  return { cities: [], terms: [] };
};

const CANVAS_STATE_KEY = 'sahabahgraph_canvas_state';

const App: React.FC = () => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const handleTourFinish = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setRunTour(false);
  };

  const startTour = () => {
    setRunTour(true);
  };

  // Check if user should see tour after data is loaded
  useEffect(() => {
    if (dataLoaded && !localStorage.getItem('hasSeenTour')) {
      // Small delay to ensure DOM is fully ready
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dataLoaded]);
  const { t, i18n } = useTranslation();
  const { data: apolloData } = useQuery(GET_SAHABAH);
  const [data, setData] = useState<GraphData | null>(null);
  const [politicalData, setPoliticalData] = useState<PoliticalData>({ cities: [], terms: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Sahabi | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'political'>('graph');
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [allPaths, setAllPaths] = useState<string[][]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const cyRef = useRef<Core | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Save canvas state to localStorage when elements change
  useEffect(() => {
    if (elements.length > 0 && dataLoaded) {
      // Debounce saves to avoid excessive writes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        try {
          // Get positions from Cytoscape if available
          const elementsWithPositions = elements.map(el => {
            if (cyRef.current && el.data.id && !el.data.source && !el.data.target) {
              const node = cyRef.current.$(`#${el.data.id}`);
              if (node.length > 0) {
                const pos = node.position();
                return { ...el, position: pos };
              }
            }
            return el;
          });
          localStorage.setItem(CANVAS_STATE_KEY, JSON.stringify(elementsWithPositions));
        } catch (error) {
          console.error('Failed to save canvas state:', error);
        }
      }, 500);
    }
  }, [elements, dataLoaded]);

  // Calculate graph statistics for AI context
  const graphStats = useMemo(() => {
    if (!data) return undefined;
    
    const prominentFigures = data.nodes
      .filter(n => ['PROPHET', 'ASHARA_MUBASHSHARA', 'BADRI'].includes(n.prominence || ''))
      .map(n => n.name_en)
      .slice(0, 10); // Top 10 prominent figures
    
    return {
      totalNodes: data.nodes.length,
      totalRelationships: data.links.length,
      prominentFigures,
    };
  }, [data]);

  // Get currently displayed nodes from the graph
  const selectedGraphNodes = useMemo(() => {
    if (!data || elements.length === 0) return [];
    
    const displayedNodeIds = new Set(
      elements
        .filter(el => el.group === 'nodes')
        .map(el => String(el.data.id))
    );
    
    return data.nodes.filter(node => displayedNodeIds.has(String(node.id)));
  }, [data, elements]);

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        const [graphData, loadedPoliticalData] = await Promise.all([loadGraphData(), loadPoliticalData()]);
        if (!isMounted) return;

        const apolloNodes: Sahabi[] = Array.isArray(apolloData?.sahabis)
          ? apolloData.sahabis.map((s: any) => ({
              ...s,
              id: normalizeNodeId(s.id),
              is_prophet: Boolean(s.is_prophet),
            }))
          : [];

        const nodes = (apolloNodes.length > 0
          ? apolloNodes.map((apolloNode) => {
              const jsonNode = graphData.nodes.find((n) => String(n.id) === String(apolloNode.id));
              return jsonNode ? { ...jsonNode, ...apolloNode } : apolloNode;
            })
          : graphData.nodes).map((node) => ({
            ...node,
            id: normalizeNodeId(node.id),
            is_prophet: normalizeProphetFlag(node.is_prophet),
          }));
        const combinedData: GraphData = {
          nodes,
          links: graphData.links,
        };

        setData(combinedData);
        setPoliticalData(loadedPoliticalData);

        // Check if there's a shared graph in URL first
        const sharedNodeIds = readShareUrl();
        if (sharedNodeIds && sharedNodeIds.length > 0) {
          // Load the shared graph state
          const sharedNodes = sharedNodeIds
            .map(id => nodes.find(n => n.id === id))
            .filter(n => n !== undefined) as Sahabi[];
          
          if (sharedNodes.length > 0) {
            const initialElements: cytoscape.ElementDefinition[] = [];
            const addedNodeIds = new Set<string>();
            
            // Add all shared nodes
            sharedNodes.forEach((sahabi) => {
              const isProphet = sahabi.id === 0;
              const nodeId = sahabi.id.toString();
              const displayName = i18n.language.startsWith('ar') && sahabi.name_ar ? sahabi.name_ar : sahabi.name_en;
              initialElements.push({
                data: {
                  ...sahabi,
                  id: nodeId,
                  label: isProphet ? '★' : displayName,
                  fullName: displayName,
                  originalId: sahabi.id,
                  is_prophet: String(sahabi.is_prophet),
                },
              });
              addedNodeIds.add(nodeId);
            });
            
            // Add edges between shared nodes
            const sharedIdStrings = sharedNodeIds.map(id => id.toString());
            combinedData.links
              .filter(link => 
                sharedIdStrings.includes(String(link.source)) && 
                sharedIdStrings.includes(String(link.target))
              )
              .forEach(link => {
                initialElements.push({
                  data: {
                    id: `e${link.source}-${link.target}`,
                    source: link.source.toString(),
                    target: link.target.toString(),
                    label: link.type,
                  },
                });
              });
            
            setElements(initialElements);
            setDataLoaded(true);
            return;
          }
        }

        // Try to restore from localStorage if no shared URL
        const savedCanvasState = localStorage.getItem(CANVAS_STATE_KEY);
        if (savedCanvasState) {
          try {
            const savedElements = JSON.parse(savedCanvasState);
            if (Array.isArray(savedElements) && savedElements.length > 0) {
              setElements(savedElements);
              setDataLoaded(true);
              return;
            }
          } catch (error) {
            console.error('Failed to restore canvas state:', error);
            localStorage.removeItem(CANVAS_STATE_KEY);
          }
        }

        // Load a balanced initial network: Prophet + top 2-3 Sahabah + limited family members (max 10 nodes)
        const coreIds = [0, 1, 2]; // Prophet, Abu Bakr, Umar
        const coreNodes = coreIds
          .map(id => nodes.find((n) => n.id === id))
          .filter((n) => n !== undefined) as Sahabi[];

        if (coreNodes.length > 0) {
          const initialElements: cytoscape.ElementDefinition[] = [];
          const addedNodeIds = new Set<string>();
          const MAX_INITIAL_NODES = 10;

          // Add core nodes (Prophet + key companions)
          coreNodes.forEach((sahabi) => {
            const isProphet = sahabi.id === 0;
            const nodeId = sahabi.id.toString();
            const displayName = i18n.language.startsWith('ar') && sahabi.name_ar ? sahabi.name_ar : sahabi.name_en;
            initialElements.push({
              data: {
                ...sahabi,
                id: nodeId,
                label: isProphet ? '★' : displayName,
                fullName: displayName,
                originalId: sahabi.id,
                is_prophet: String(sahabi.is_prophet),
              },
            });
            addedNodeIds.add(nodeId);
          });

          // Find immediate family relationships (prioritize Prophet's family)
          const coreIdStrings = coreIds.map(id => id.toString());
          const familyLinks = combinedData.links.filter(
            (link) =>
              link.category === 'family' &&
              (coreIdStrings.includes(String(link.source)) ||
               coreIdStrings.includes(String(link.target)))
          );

          // Prioritize Prophet's family, then others - but limit to max nodes
          const prophetLinks = familyLinks.filter(link => 
            String(link.source) === '0' || String(link.target) === '0'
          );
          const otherLinks = familyLinks.filter(link => 
            String(link.source) !== '0' && String(link.target) !== '0'
          );
          const prioritizedLinks = [...prophetLinks, ...otherLinks];

          // Add family members until we reach the node limit
          for (const link of prioritizedLinks) {
            // Stop if we've reached the maximum nodes
            if (addedNodeIds.size >= MAX_INITIAL_NODES) break;

            const sourceId = link.source.toString();
            const targetId = link.target.toString();

            // Add source node if not already added and under limit
            if (!addedNodeIds.has(sourceId) && addedNodeIds.size < MAX_INITIAL_NODES) {
              const sourceNode = nodes.find((n) => String(n.id) === sourceId);
              if (sourceNode) {
                const displayName = i18n.language.startsWith('ar') && sourceNode.name_ar ? sourceNode.name_ar : sourceNode.name_en;
                initialElements.push({
                  data: {
                    ...sourceNode,
                    id: sourceId,
                    label: displayName,
                    fullName: displayName,
                    originalId: sourceNode.id,
                    is_prophet: String(sourceNode.is_prophet),
                  },
                });
                addedNodeIds.add(sourceId);
              }
            }

            // Add target node if not already added and under limit
            if (!addedNodeIds.has(targetId) && addedNodeIds.size < MAX_INITIAL_NODES) {
              const targetNode = nodes.find((n) => String(n.id) === targetId);
              if (targetNode) {
                const displayName = i18n.language.startsWith('ar') && targetNode.name_ar ? targetNode.name_ar : targetNode.name_en;
                initialElements.push({
                  data: {
                    ...targetNode,
                    id: targetId,
                    label: displayName,
                    fullName: displayName,
                    originalId: targetNode.id,
                    is_prophet: String(targetNode.is_prophet),
                  },
                });
                addedNodeIds.add(targetId);
              }
            }

            // Only add the edge if both nodes are present
            if (addedNodeIds.has(sourceId) && addedNodeIds.has(targetId)) {
              initialElements.push({
                data: {
                  id: `e${sourceId}-${targetId}`,
                  source: sourceId,
                  target: targetId,
                  label: link.type,
                },
              });
            }
          }

          setElements(initialElements);
          setDataLoaded(true); // Mark data as loaded for tour
        } else if (nodes.length > 0) {
          const firstNode = nodes[0];
          const displayName = i18n.language.startsWith('ar') && firstNode.name_ar ? firstNode.name_ar : firstNode.name_en;
          setElements([
            {
              data: {
                ...firstNode,
                id: firstNode.id.toString(),
                label: displayName,
                fullName: displayName,
                originalId: firstNode.id,
                is_prophet: String(firstNode.is_prophet),
              },
            },
          ]);
          setDataLoaded(true); // Mark data as loaded for tour
        }
      } catch (error) {
        console.error('Failed to initialize graph data', error);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [apolloData]);

  const filteredNodes = useMemo(() => {
    if (!data) return [];
    return data.nodes.filter(n =>
      n.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.name_ar && n.name_ar.includes(searchTerm)) ||
      (n.laqab && n.laqab.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const getViewportCenter = () => {
    const cy = cyRef.current;
    if (!cy) return { x: 0, y: 0 };
    const extent = cy.extent();
    return {
      x: (extent.x1 + extent.x2) / 2,
      y: (extent.y1 + extent.y2) / 2,
    };
  };

  const addNodeToGraph = (node: Sahabi) => {
    setElements((prev) => {
      const exists = prev.find(el => el.data.id === node.id.toString());
      if (exists) return prev;
      const center = getViewportCenter();
      return [
        ...prev,
        {
          data: { ...node, id: node.id.toString(), label: (i18n.language.startsWith('ar') && node.name_ar ? node.name_ar : node.name_en), originalId: node.id, is_prophet: String(node.is_prophet) },
          position: center,
        },
      ];
    });
  };

  const removeNodesFromGraph = (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    const removableNodeIds = new Set(nodeIds);

    setElements((prev) => {
      const filtered = prev.filter((el) => {
        const elId = String(el.data.id ?? '');
        const source = String(el.data.source ?? '');
        const target = String(el.data.target ?? '');

        if (removableNodeIds.has(elId)) return false;
        if (source && removableNodeIds.has(source)) return false;
        if (target && removableNodeIds.has(target)) return false;
        return true;
      });
      
      // Clear localStorage if all nodes removed
      if (filtered.length === 0) {
        localStorage.removeItem(CANVAS_STATE_KEY);
      }
      
      return filtered;
    });

    if (selectedNode && removableNodeIds.has(String(selectedNode.id))) {
      setSelectedNode(null);
    }

    setAllPaths([]);
    setCurrentPathIndex(0);
    cyRef.current?.elements().removeClass('highlighted');
  };

  const removeAllNodes = () => {
    setElements([]);
    setSelectedNode(null);
    setAllPaths([]);
    setCurrentPathIndex(0);
    cyRef.current?.elements().removeClass('highlighted');
    localStorage.removeItem(CANVAS_STATE_KEY);
  };

  const expandRelationships = (nodeId: number | string, categoryOrType: string) => {
    if (!data) return;
    const rels = data.links.filter(l =>
      (String(l.source) === String(nodeId) || String(l.target) === String(nodeId)) &&
      (l.category === categoryOrType || l.type === categoryOrType)
    );

    const newElements: cytoscape.ElementDefinition[] = [];

    const selectedGraphNode = data.nodes.find((n) => String(n.id) === String(nodeId));
    if (selectedGraphNode) {
      newElements.push({
        data: {
          ...selectedGraphNode,
          id: selectedGraphNode.id.toString(),
          label: (i18n.language.startsWith('ar') && selectedGraphNode.name_ar ? selectedGraphNode.name_ar : selectedGraphNode.name_en),
          originalId: selectedGraphNode.id,
          is_prophet: String(selectedGraphNode.is_prophet),
        },
      });
    }

    rels.forEach(rel => {
      const otherId = String(rel.source) === String(nodeId) ? rel.target : rel.source;
      const otherNode = data.nodes.find(n => String(n.id) === String(otherId));
      if (otherNode) {
        newElements.push({ data: { ...otherNode, id: otherNode.id.toString(), label: (i18n.language.startsWith('ar') && otherNode.name_ar ? otherNode.name_ar : otherNode.name_en), originalId: otherNode.id, is_prophet: String(otherNode.is_prophet) } });
        newElements.push({
          data: {
            id: `e${rel.source}-${rel.target}`,
            source: rel.source.toString(),
            target: rel.target.toString(),
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

  const highlightPath = (path: string[]) => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass('highlighted');
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        cyRef.current.$(`#${u}, #${v}`).addClass('highlighted');
        cyRef.current.$(`edge[source="${u}"][target="${v}"], edge[source="${v}"][target="${u}"]`).addClass('highlighted');
      }
      cyRef.current.fit(cyRef.current.elements('.highlighted'), 50);
    }
  };

  const handleShowConnections = () => {
    const selectedNodes = cyRef.current?.$(':selected');
    if (selectedNodes?.length !== 2) {
      alert(t('select_two_nodes'));
      return;
    }

    const startId = selectedNodes[0].id();
    const endId = selectedNodes[1].id();

    if (!data) return;

    const worker = new Worker(new URL('./workers/pathfinder.ts', import.meta.url), { type: 'module' });
    worker.postMessage({ data, startId, endId });

    worker.onmessage = (e: MessageEvent<string[][]>) => {
      const paths = e.data;
      if (paths && paths.length > 0) {
        setAllPaths(paths);
        setCurrentPathIndex(0);

        const path = paths[0];
        const newElements: cytoscape.ElementDefinition[] = [];
        paths.forEach(p => {
          for (let i = 0; i < p.length; i++) {
            const nodeId = p[i];
            const node = data?.nodes.find(n => n.id.toString() === nodeId);
            if (node) {
              newElements.push({ data: { ...node, id: node.id.toString(), label: (i18n.language.startsWith('ar') && node.name_ar ? node.name_ar : node.name_en), originalId: node.id, is_prophet: String(node.is_prophet) } });
            }

            if (i < p.length - 1) {
              const u = p[i];
              const v = p[i + 1];
              const rel = data?.links.find(l =>
                (l.source.toString() === u && l.target.toString() === v) ||
                (l.source.toString() === v && l.target.toString() === u)
              );
              if (rel) {
                newElements.push({
                  data: {
                    id: `e${rel.source}-${rel.target}`,
                    source: rel.source.toString(),
                    target: rel.target.toString(),
                    label: rel.type
                  }
                });
              }
            }
          }
        });

        setElements((prev) => {
          const existingIds = new Set(prev.map(el => el.data.id));
          const filteredNew = newElements.filter(el => !existingIds.has(el.data.id));
          return [...prev, ...filteredNew];
        });

        setTimeout(() => highlightPath(path), 200);
      } else {
        alert(t('no_path_found'));
      }
    };
  };

  const handleSelectNode = (node: Sahabi) => {
    // Set selected node for detail panel
    setSelectedNode(node);
    
    // If node is already in the graph, focus on it
    setTimeout(() => {
      if (cyRef.current && viewMode === 'graph') {
        const cyNode = cyRef.current.$(`#${node.id}`);
        if (cyNode.length > 0) {
          // Node exists in graph, center on it
          cyRef.current.center(cyNode);
          cyRef.current.zoom({
            level: 2,
            position: cyNode.position()
          });
          // Highlight the node briefly
          cyNode.addClass('highlighted');
          setTimeout(() => {
            cyNode.removeClass('highlighted');
          }, 2000);
        }
      }
    }, 100);
  };

  const handleShare = async () => {
    // Get currently displayed node IDs (nodes don't have source/target properties)
    const displayedNodeIds = elements
      .filter(el => !el.data.source && !el.data.target && el.data.originalId !== undefined)
      .map(el => el.data.originalId as number)
      .sort((a, b) => a - b);

    if (displayedNodeIds.length === 0) {
      setShareMessage(t('no_nodes_to_share', { defaultValue: 'No nodes to share. Add some nodes first!' }));
      setShareSnackbarOpen(true);
      return;
    }

    const shareUrl = generateShareUrl(displayedNodeIds);
    const success = await copyToClipboard(shareUrl);

    if (success) {
      setShareMessage(t('share_link_copied', { defaultValue: 'Share link copied to clipboard!' }));
    } else {
      setShareMessage(t('share_link_failed', { defaultValue: 'Failed to copy link. Please copy manually: ' + shareUrl }));
    }
    setShareSnackbarOpen(true);
  };

  return (
    <MainLayout
      tour={<OnboardingTour run={runTour} onFinish={handleTourFinish} />}
      sidebar={
        <SahabahSidebar
          onStartTour={startTour}
          nodes={filteredNodes}
          onAddNode={addNodeToGraph}
          onSelectNode={handleSelectNode}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      }
      detailPanel={
        <SahabahDetail
          selectedNode={selectedNode}
          links={data?.links || []}
          onExpand={expandRelationships}
        />
      }
    >
      <MuiBox sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1100 }}>
        <ToggleButtonGroup id="tour-view-toggler"
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
          sx={{ bgcolor: 'background.paper' }}
        >
          <ToggleButton value="graph">
            <GraphIcon sx={{ mr: 1 }} />
            {t('graph_view')}
          </ToggleButton>
          <ToggleButton value="timeline">
            <TimelineIcon sx={{ mr: 1 }} />
            {t('timeline_view')}
          </ToggleButton>
          <ToggleButton value="political">
            <PublicIcon sx={{ mr: 1 }} />
            {t('political_view')}
          </ToggleButton>
        </ToggleButtonGroup>
      </MuiBox>

      {viewMode === 'graph' ? (
        <GraphCanvas
          elements={elements}
          onNodeClick={setSelectedNode}
          cyRef={cyRef}
          onShowConnections={handleShowConnections}
          onDeleteSelectedNodes={removeNodesFromGraph}
          onRemoveAll={removeAllNodes}
          onShare={handleShare}
        />
      ) : viewMode === 'timeline' ? (
        <TimelineView
          nodes={data?.nodes || []}
          onSelectNode={handleSelectNode}
          selectedNode={selectedNode}
        />
      ) : (
        <PoliticalView
          cities={politicalData.cities}
          terms={politicalData.terms}
          nodes={data?.nodes || []}
          onSelectGovernor={handleSelectNode}
          onLinkGovernor={(node) => {
            addNodeToGraph(node);
            handleSelectNode(node);
            setViewMode('graph');
          }}
        />
      )}
      {allPaths.length > 0 && (
        <PathSummary
          path={allPaths[currentPathIndex]}
          data={data}
          onClose={() => {
            setAllPaths([]);
            cyRef.current?.elements().removeClass('highlighted');
          }}
          totalPaths={allPaths.length}
          currentPathIndex={currentPathIndex}
          onNext={() => {
            const next = (currentPathIndex + 1) % allPaths.length;
            setCurrentPathIndex(next);
            highlightPath(allPaths[next]);
          }}
          onPrev={() => {
            const prev = (currentPathIndex - 1 + allPaths.length) % allPaths.length;
            setCurrentPathIndex(prev);
            highlightPath(allPaths[prev]);
          }}
        />
      )}
      <AIChatPanel 
        onClearCanvas={removeAllNodes}
        onFocusNode={(nodeName) => {
          const node = data?.nodes.find(n => n.name_en.toLowerCase() === nodeName.toLowerCase());
          if (node) {
            setSelectedNode(node);
            // Focus on node in cytoscape
            setTimeout(() => {
              if (cyRef.current) {
                const cyNode = cyRef.current.$(`#${node.id}`);
                if (cyNode.length > 0) {
                  cyRef.current.center(cyNode);
                  cyRef.current.zoom({
                    level: 2,
                    position: cyNode.position()
                  });
                }
              }
            }, 100);
          }
        }}
        onAddNode={addNodeToGraph}
        onFilterNodes={(criteria) => {
          // Apply filters via search for now
          if (criteria.name) {
            setSearchTerm(criteria.name);
          }
        }}
        onSwitchView={(view) => setViewMode(view)}
        onZoomIn={() => {
          if (cyRef.current) {
            cyRef.current.zoom(cyRef.current.zoom() * 1.2);
          }
        }}
        onZoomOut={() => {
          if (cyRef.current) {
            cyRef.current.zoom(cyRef.current.zoom() * 0.8);
          }
        }}
        onResetZoom={() => {
          if (cyRef.current) {
            cyRef.current.fit();
          }
        }}
        onSearchChange={setSearchTerm}
        allNodes={data?.nodes || []}
        cyRef={cyRef}
        currentView={viewMode}
        selectedNodes={selectedGraphNodes}
        graphStats={graphStats}
      />
      <Snackbar
        open={shareSnackbarOpen}
        autoHideDuration={4000}
        onClose={() => setShareSnackbarOpen(false)}
        message={shareMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </MainLayout>
  );
};

export default App;
