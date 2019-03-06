import { Graph, Edge, Node, Layout } from '../model';


import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY
} from 'd3-force';

import { Observable, Subject } from 'rxjs';

export interface D3ForceDirectedSettings {
  force?: any;
  forceLink?: any;
}
export interface D3Node {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fx?: number;
  fy?: number;
}
export interface D3Edge {
  id: string;
  source: D3Node;
  target: D3Node;
}
export interface D3Graph {
  nodes: D3Node[];
  edges: D3Edge[];
}

export class D3ForceDirectedLayout implements Layout {
  defaultSettings: D3ForceDirectedSettings = {
   force: forceSimulation<any>()
   .force('charge', forceManyBody().strength(-150))
   .force('collide', forceCollide(5)),
   forceLink: forceLink<any, any>().id(node => node.id).distance(() => 100),
  };

  settings: D3ForceDirectedSettings = {};


  d3Graph: D3Graph;
  outputGraph$: Subject<Graph> = new Subject();

  draggingStart: { x: number, y: number };


  run(graph: Graph): Observable<Graph> {
    // copy the input graph for D3
    this.d3Graph = {
      nodes: [...graph.nodes.map(n => ({...n}))] as any,
      edges: [...graph.edges.map(e => ({...e}))] as any,
    };

    this.settings = Object.assign({}, this.defaultSettings, this.settings);


    if(this.settings.force) {
      this.settings.force.nodes(this.d3Graph.nodes)
        .force('link', this.settings.forceLink.links(this.d3Graph.edges))
        .alpha(0.5).restart()
        .on('tick', () => {
          this.outputGraph$.next(this.d3GraphToOutputGraph(this.d3Graph, graph));
        });
    }

    return this.outputGraph$.asObservable();
  }

  updateEdge(graph: Graph, edge: Edge): Observable<Graph> {
    // TODO: this updates the edge as a direct line, make it a multipoint edge
    const settings = Object.assign({}, this.defaultSettings, this.settings);
    if(settings.force) {
      settings.force.nodes(this.d3Graph.nodes)
        .force('link', settings.forceLink.links(this.d3Graph.edges))
        .alpha(0.5).restart()
        .on('tick', () => {
          this.outputGraph$.next(this.d3GraphToOutputGraph(this.d3Graph, graph));
        });
    }

    return this.outputGraph$.asObservable();
  }


  d3GraphToOutputGraph(d3Graph: D3Graph, graph:Graph): Graph {
   this.d3Graph.nodes.forEach((d3Node: D3Node) => {
     const node = graph.nodes.find(n => n.id === d3Node.id);
     node.position = {
       x: d3Node.x,
       y: d3Node.y,
     };
     node.dimension = {
       width: node.dimension && node.dimension.width || 20,
       height: node.dimension && node.dimension.height || 20,
     };
     // // do we realy need to update the transform? itn't done by the component itself?
     // node.transform = `translate(${
     //   d3Node.x - (node.dimension && node.dimension.width || 20) / 2 || 0
     // }, ${
     //   d3Node.y - (node.dimension && node.dimension.height || 20) / 2 || 0
     // })`;
   });

   this.d3Graph.edges.forEach((d3Edge: D3Edge) => {
     const edge = graph.edges.find(e => e.id === d3Edge.id);
     edge.points = [
       {
         x: d3Edge.source.x,
         y: d3Edge.source.y,
       },
       {
         x: d3Edge.target.x,
         y: d3Edge.target.y,
       },
     ];
     // source: toD3Node(edge.source).id,
     // target: toD3Node(edge.target).id,

   });

   return graph;
 }

 onDragStart(draggingNode: Node, $event: MouseEvent): void {
   this.settings.force.alphaTarget(0.3).restart();
   const node = this.d3Graph.nodes.find(d3Node => d3Node.id === draggingNode.id);
   if (!node) {
     return;
   }
   this.draggingStart = { x: $event.x - node.x, y: $event.y - node.y };
   node.fx = $event.x - this.draggingStart.x;
   node.fy = $event.y - this.draggingStart.y;
 }

 onDrag(draggingNode: Node, $event: MouseEvent): void {
   if (!draggingNode) return;
   const node = this.d3Graph.nodes.find(d3Node => d3Node.id === draggingNode.id);
   if (!node) {
     return;
   }
   node.fx = $event.x - this.draggingStart.x;
   node.fy = $event.y - this.draggingStart.y;
 }

 onDragEnd(draggingNode: Node, $event: MouseEvent): void {
   if (!draggingNode) return;
   const node = this.d3Graph.nodes.find(d3Node => d3Node.id === draggingNode.id);
   if (!node) {
     return;
   }

   this.settings.force.alphaTarget(0);
   node.fx = undefined;
   node.fy = undefined;
 }
}
