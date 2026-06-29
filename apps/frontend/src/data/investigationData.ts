import alertsJson from "./alerts.json";
import graphsJson from "./graphs.json";
import type { GraphEdge, GraphNode } from "./staticData";

export type InvestigationAlert = {
  id: number;
  alertId: string;
  graphId: string;
  accountId: number;
  severity: string;
  status: string;
  pattern: string;
  amount: number;
  assignee: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  accountName: string;
  accountNumber: string;
  customerName: string;
  riskLevel: string;
  fraudPattern: string;
  investigationStatus: string;
};

export type InvestigationGraph = {
  graphId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  suspiciousNodes: string[];
  suspiciousEdges: string[];
};

export type GraphNetwork = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    flaggedNodes: number;
    flaggedEdges: number;
    detectedClusters: number;
  };
};

export const investigationAlerts = alertsJson as InvestigationAlert[];
export const investigationGraphs = graphsJson.graphs as InvestigationGraph[];

export function getInvestigationAlertById(id: number): InvestigationAlert | undefined {
  return investigationAlerts.find(a => a.id === id);
}

export function getInvestigationAlertByAlertId(alertId: string): InvestigationAlert | undefined {
  return investigationAlerts.find(a => a.alertId === alertId);
}

export function getGraphById(graphId: string): InvestigationGraph | undefined {
  return investigationGraphs.find(g => g.graphId === graphId);
}

export function buildNetworkFromGraph(graph: InvestigationGraph): GraphNetwork {
  const suspiciousNodeSet = new Set(graph.suspiciousNodes);
  const suspiciousEdgeSet = new Set(graph.suspiciousEdges);

  const nodes = graph.nodes.map(node => ({
    ...node,
    flagged: suspiciousNodeSet.has(node.id) ? true : node.flagged,
  }));

  const edges = graph.edges.map(edge => ({
    ...edge,
    flagged: suspiciousEdgeSet.has(edge.id) ? true : edge.flagged,
  }));

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      flaggedNodes: nodes.filter(n => n.flagged).length,
      flaggedEdges: edges.filter(e => e.flagged).length,
      detectedClusters: 1,
    },
  };
}
