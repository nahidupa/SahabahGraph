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
import './i18n/config';
import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup, Box as MuiBox } from '@mui/material';
import { AccountTree as GraphIcon, ViewTimeline as TimelineIcon, Public as PublicIcon } from '@mui/icons-material';

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

const normalizeProphetFlag = (value: unknown): 'true' | 'false' => {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).toLowerCase() === 'true' ? 'true' : 'false';
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

const App: React.FC = () => {
  const { t } = useTranslation();
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
              is_prophet: s.is_prophet ? 'true' : 'false',
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

        const prophet = nodes.find((n) => n.id === 0) ?? nodes[0];
        if (prophet) {
          setElements([
            {
              data: {
                ...prophet,
                id: prophet.id.toString(),
                label: '★',
                fullName: prophet.name_en,
                originalId: prophet.id,
              },
            },
          ]);
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
          data: { ...node, id: node.id.toString(), label: node.name_en, originalId: node.id },
          position: center,
        },
      ];
    });
  };

  const removeNodesFromGraph = (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    const removableNodeIds = new Set(nodeIds);

    setElements((prev) =>
      prev.filter((el) => {
        const elId = String(el.data.id ?? '');
        const source = String(el.data.source ?? '');
        const target = String(el.data.target ?? '');

        if (removableNodeIds.has(elId)) return false;
        if (source && removableNodeIds.has(source)) return false;
        if (target && removableNodeIds.has(target)) return false;
        return true;
      })
    );

    if (selectedNode && removableNodeIds.has(String(selectedNode.id))) {
      setSelectedNode(null);
    }

    setAllPaths([]);
    setCurrentPathIndex(0);
    cyRef.current?.elements().removeClass('highlighted');
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
          label: selectedGraphNode.name_en,
          originalId: selectedGraphNode.id,
        },
      });
    }

    rels.forEach(rel => {
      const otherId = String(rel.source) === String(nodeId) ? rel.target : rel.source;
      const otherNode = data.nodes.find(n => String(n.id) === String(otherId));
      if (otherNode) {
        newElements.push({ data: { ...otherNode, id: otherNode.id.toString(), label: otherNode.name_en, originalId: otherNode.id } });
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
              newElements.push({ data: { ...node, id: node.id.toString(), label: node.name_en, originalId: node.id } });
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

  return (
    <MainLayout
      sidebar={
        <SahabahSidebar
          nodes={filteredNodes}
          onAddNode={addNodeToGraph}
          onSelectNode={setSelectedNode}
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
        <ToggleButtonGroup
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
            {t('political_view', { defaultValue: 'Political View' })}
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
        />
      ) : viewMode === 'timeline' ? (
        <TimelineView
          nodes={data?.nodes || []}
          onSelectNode={setSelectedNode}
          selectedNode={selectedNode}
        />
      ) : (
        <PoliticalView
          cities={politicalData.cities}
          terms={politicalData.terms}
          nodes={data?.nodes || []}
          onSelectGovernor={setSelectedNode}
          onLinkGovernor={(node) => {
            addNodeToGraph(node);
            setSelectedNode(node);
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
    </MainLayout>
  );
};

export default App;
