import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import type { Core } from 'cytoscape';
import type { GraphData, Sahabi } from './types';
import MainLayout from './components/Layout/MainLayout';
import SahabahSidebar from './components/Sidebar/SahabahSidebar';
import GraphCanvas from './components/Graph/GraphCanvas';
import SahabahDetail from './components/DetailPanel/SahabahDetail';
import PathSummary from './components/Graph/PathSummary';
import { useTranslation } from 'react-i18next';
import './i18n/config';

const GET_SAHABAH = gql`
  query GetSahabah {
    sahabis {
      id
      name
      gender
      is_prophet
      title
      bio
    }
  }
`;

const App: React.FC = () => {
  const { t } = useTranslation();
  const { data: apolloData } = useQuery(GET_SAHABAH);
  const [data, setData] = useState<GraphData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Sahabi | null>(null);
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [currentPath, setCurrentPath] = useState<string[] | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (apolloData && apolloData.sahabis) {
      const nodes: Sahabi[] = apolloData.sahabis.map((s: Sahabi) => ({
        ...s,
        is_prophet: s.is_prophet ? "True" : "False"
      }));

      // For links, we still need to fetch from the JSON for now,
      // or we could expand the GraphQL query to include relationships.
      // Given the current architecture, let's keep the JSON fetch for links
      // but prefer GraphQL for nodes if available.
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
            setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name, originalId: prophet.id } }]);
          }
        })
        .catch(() => {
          // Fallback to purely JSON if GraphQL fails or during transition
          fetch('./data/sahabah_data.json')
            .then((res) => res.json())
            .then((json: GraphData) => {
              setData(json);
              const prophet = json.nodes.find(n => n.id === 0);
              if (prophet) {
                setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name, originalId: prophet.id } }]);
              }
            });
        });
    } else {
      // Original fetch for initial load or if Apollo fails
      fetch('./data/sahabah_data.json')
        .then((res) => res.json())
        .then((json: GraphData) => {
          setData(json);
          const prophet = json.nodes.find(n => n.id === 0);
          if (prophet) {
            setElements([{ data: { ...prophet, id: prophet.id.toString(), label: '★', fullName: prophet.name, originalId: prophet.id } }]);
          }
        });
    }
  }, [apolloData]);

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

    const newElements: cytoscape.ElementDefinition[] = [];
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

    worker.onmessage = (e: MessageEvent<string[] | null>) => {
      const path = e.data;
      if (path) {
        setCurrentPath(path);
        // Add missing nodes and edges to elements
        const newElements: cytoscape.ElementDefinition[] = [];
        for (let i = 0; i < path.length; i++) {
          const nodeId = path[i];
          const node = data?.nodes.find(n => n.id.toString() === nodeId);
          if (node) {
            newElements.push({ data: { ...node, id: node.id.toString(), label: node.name, originalId: node.id } });
          }

          if (i < path.length - 1) {
            const u = path[i];
            const v = path[i + 1];
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

        setElements((prev) => {
          const existingIds = new Set(prev.map(el => el.data.id));
          const filteredNew = newElements.filter(el => !existingIds.has(el.data.id));
          return [...prev, ...filteredNew];
        });

        // Highlight path
        setTimeout(() => {
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
        }, 200);
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
      <GraphCanvas
        elements={elements}
        onNodeClick={setSelectedNode}
        cyRef={cyRef}
        onShowConnections={handleShowConnections}
      />
      {currentPath && (
        <PathSummary
          path={currentPath}
          data={data}
          onClose={() => {
            setCurrentPath(null);
            cyRef.current?.elements().removeClass('highlighted');
          }}
        />
      )}
    </MainLayout>
  );
};

export default App;
