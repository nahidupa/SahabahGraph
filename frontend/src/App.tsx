import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
// i18n import for side-effects
import type { Core } from 'cytoscape';
import type { GraphData, Sahabi } from './types';
import MainLayout from './components/Layout/MainLayout';
import SahabahSidebar from './components/Sidebar/SahabahSidebar';
import GraphCanvas from './components/Graph/GraphCanvas';
import TimelineView from './components/Timeline/TimelineView';
import SahabahDetail from './components/DetailPanel/SahabahDetail';
import PathSummary from './components/Graph/PathSummary';
import './i18n/config';
import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup, Box as MuiBox } from '@mui/material';
import { AccountTree as GraphIcon, ViewTimeline as TimelineIcon } from '@mui/icons-material';

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

const App: React.FC = () => {
  const { t } = useTranslation();
  const { data: apolloData } = useQuery(GET_SAHABAH);
  const [data, setData] = useState<GraphData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Sahabi | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'timeline'>('graph');
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [allPaths, setAllPaths] = useState<string[][]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (apolloData && apolloData.sahabis) {
      const nodes: Sahabi[] = apolloData.sahabis.map((s: any) => ({
        ...s,
        is_prophet: s.is_prophet ? "True" : "False"
      }));

      fetch('./data/sahabah_data.json')
        .then((res) => res.json())
        .then((json: GraphData) => {
          const combinedData = {
            nodes: nodes,
            links: json.links
          };
          setData(combinedData);
          const prophet = nodes.find(n => n.id === 0);
          if (prophet) {
            setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name_en, originalId: prophet.id } }]);
          }
        })
        .catch(() => {
          fetch('./data/sahabah_data.json')
            .then((res) => res.json())
            .then((json: GraphData) => {
              setData(json);
              const prophet = json.nodes.find(n => n.id === 0);
              if (prophet) {
                setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name_en, originalId: prophet.id } }]);
              }
            });
        });
    } else {
      fetch('./data/sahabah_data.json')
        .then((res) => res.json())
        .then((json: GraphData) => {
          setData(json);
          const prophet = json.nodes.find(n => n.id === 0);
          if (prophet) {
            setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name_en, originalId: prophet.id } }]);
          }
        });
    }
  }, [apolloData]);

  const filteredNodes = useMemo(() => {
    if (!data) return [];
    return data.nodes.filter(n =>
      n.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.name_ar && n.name_ar.includes(searchTerm)) ||
      (n.laqab && n.laqab.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const addNodeToGraph = (node: Sahabi) => {
    setElements((prev) => {
      const exists = prev.find(el => el.data.id === node.id.toString());
      if (exists) return prev;
      return [...prev, { data: { ...node, id: node.id.toString(), label: node.name_en, originalId: node.id } }];
    });
  };

  const expandRelationships = (nodeId: number, categoryOrType: string) => {
    if (!data) return;
    const rels = data.links.filter(l =>
      (l.source_id === nodeId || l.target_id === nodeId) &&
      (l.category === categoryOrType || l.type === categoryOrType)
    );

    const newElements: cytoscape.ElementDefinition[] = [];
    rels.forEach(rel => {
      const otherId = rel.source_id === nodeId ? rel.target_id : rel.source_id;
      const otherNode = data.nodes.find(n => n.id === otherId);
      if (otherNode) {
        newElements.push({ data: { ...otherNode, id: otherNode.id.toString(), label: otherNode.name_en, originalId: otherNode.id } });
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
                (l.source_id.toString() === u && l.target_id.toString() === v) ||
                (l.source_id.toString() === v && l.target_id.toString() === u)
              );
              if (rel) {
                newElements.push({
                  data: {
                    id: `e${rel.source_id}-${rel.target_id}`,
                    source: rel.source_id.toString(),
                    target: rel.target_id.toString(),
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
        </ToggleButtonGroup>
      </MuiBox>

      {viewMode === 'graph' ? (
        <GraphCanvas
          elements={elements}
          onNodeClick={setSelectedNode}
          cyRef={cyRef}
          onShowConnections={handleShowConnections}
          links={data?.links || []}
          onExpand={expandRelationships}
        />
      ) : (
        <TimelineView
          nodes={data?.nodes || []}
          onSelectNode={setSelectedNode}
          selectedNode={selectedNode}
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
