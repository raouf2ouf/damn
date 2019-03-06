import { AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  NgZone,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  Renderer2} from '@angular/core';

// rename transition due to conflict with d3 transition
import { animate,
style,
transition as ngTransition,
trigger } from '@angular/animations';

import {
  BaseChartComponent,
  ChartComponent,
  ColorHelper,
  ViewDimensions,
  calculateViewDimensions
} from '@swimlane/ngx-charts';

import { select } from 'd3-selection';
import * as shape from 'd3-shape';
import 'd3-transition';
import { Observable, Subscription, of } from 'rxjs';
import { first } from 'rxjs/operators';
import { identity, scale, toSVG, transform, translate } from 'transformation-matrix';
import { Layout, Edge, Node, Graph} from '../model';
import { LayoutService } from '../layout';

/**
 * Matrix
 */
export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}


@Component({
  selector: 'sg-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('link', [ngTransition('* => *', [animate(500, style({ transform: '*' }))])])]
})
export class GraphComponent extends BaseChartComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() nodes: Node[] = [];
  @Input() links: Edge[] = [];
  @Input() curve: any;
  @Input() activeEntries: any[] = [];

  @Input() nodeHeight: number;
  @Input() nodeMaxHeight: number;
  @Input() nodeMinHeight: number;

  @Input() nodeWidth:number;
  @Input() nodeMinWidth:number;
  @Input() nodeMaxWidth: number;

  @Input() panningEnabled:boolean = true;
  @Input() draggingEnabled: boolean = true;
  @Input() hoveringEnabled: boolean = true;

  @Input() enableZoom: boolean = true;
  @Input() zoomSpeed: number = 0.1;
  @Input() minZoomLevel: number = 0.1;
  @Input() maxZoomLevel: number = 4.0;
  @Input() autoZoom: boolean = false;
  @Input() panOnZoom: boolean = true;
  @Input() autoCenter: boolean = false;
  @Input() computePositionsAfterCollapse:boolean = true;

  @Input() update$: Observable<any>;
  @Input() center$: Observable<any>;
  @Input() zoomToFit$: Observable<any>;

  @Input() layout: string | Layout;
  @Input() layoutSettings: any;

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();

  @ContentChild('linkTemplate') linkTemplate: TemplateRef<any>;
  @ContentChild('nodeTemplate') nodeTemplate: TemplateRef<any>;
  @ContentChild('defsTemplate') defsTemplate: TemplateRef<any>;

  @ViewChild(ChartComponent, { read: ElementRef }) chart: ElementRef;

  @ViewChildren('nodeElement') nodeElements: QueryList<ElementRef>;
  @ViewChildren('linkElement') linkElements: QueryList<ElementRef>;


  graphSubscription: Subscription = new Subscription();
  subscriptions: Subscription[] = [];
  dims: ViewDimensions;
  margin = [0, 0, 0, 0];
  results = [];
  transform: string;
  isPanning: boolean = false;
  isDragging: boolean = false;
  draggingNode: Node;
  initialized: boolean = false;
  graph: Graph;
  graphDims: any = { width: 0, height: 0 };
  transformationMatrix: Matrix = identity();
  _touchLastX = null;
  _touchLastY = null;



  /* ================================================================================================== */
  /* Component lifecycle
  /* ================================================================================================== */
  constructor(private el: ElementRef,
    public zone: NgZone,
    public cd: ChangeDetectorRef,
    private layoutService: LayoutService,
    private renderer: Renderer2) {
    super(el,zone,cd);
  }

  ngOnInit(): void {
    if (this.update$) {
      this.subscriptions.push(
        this.update$.subscribe(() => {
          this.update();
        })
      );
    }
    if (this.center$) {
      this.subscriptions.push(
        this.center$.subscribe(() => {
          this.center();
        })
      );
    }
    if (this.zoomToFit$) {
      this.subscriptions.push(
        this.zoomToFit$.subscribe(() => {
          this.zoomToFit();
        })
      );
    }
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    setTimeout(() => this.update());
  }

  ngOnChanges(changes: SimpleChanges): void {

    const { layout, layoutSettings, nodes, links } = changes;
    if (layout) {
      this.setLayout(this.layout);
    }
    if (layoutSettings) {
      this.setLayoutSettings(this.layoutSettings);
    }
    if (nodes || links) {
      this.update();
    }
  }

  ngOnDestroy(): void {
   super.ngOnDestroy();
   for (const sub of this.subscriptions) {
     sub.unsubscribe();
   }
   this.subscriptions = null;
  }

  /* ================================================================================================== */
  /* Graph Positionning and Dimentions computation
  /* ================================================================================================== */
  /**
   * Get the current `x` position of the graph
   */
  get panOffsetX() {
    return this.transformationMatrix.e;
  }
  /**
   * Set the current `x` position of the graph
   */
  @Input('panOffsetX')
  set panOffsetX(x) {
    this.panTo(Number(x), null);
  }
  /**
   * Get the current `y` position of the graph
   */
  get panOffsetY() {
    return this.transformationMatrix.f;
  }
  /**
   * Set the current `y` position of the graph
   */
  @Input('panOffsetY')
  set panOffsetY(y) {
    this.panTo(null, Number(y));
  }
  /**
   * Center the graph in the viewport
   */
  center(): void {
    this.panTo(
      this.dims.width / 2 - this.graphDims.width * this.zoomLevel / 2,
      this.dims.height / 2 - this.graphDims.height * this.zoomLevel / 2
    );
  }

  /* ================================================================================================== */
  /* Drawing Graph
  /* ================================================================================================== */
  setLayout(layout: string | Layout): void {
    this.initialized = false;
    if (!layout) {
      layout = 'dagre';
    }
    if (typeof layout === 'string') {
      this.layout = this.layoutService.getLayout(layout);
      this.setLayoutSettings(this.layoutSettings);
    }
  }
  setLayoutSettings(settings: any): void {
    if (this.layout && typeof this.layout !== 'string') {
      this.layout.settings = settings;
      this.update();
    }
  }
  /**
   * Creates the dagre graph engine
   *
   *
   * @memberOf GraphComponent
   */
  createGraph(): void {
    this.graphSubscription.unsubscribe();
    this.graphSubscription = new Subscription();
    this.nodes.forEach((n) => {
      n.dimension = {
        width: 30,
        height: 30
      };

      n.position = {
        x: 0,
        y: 0
      };

      n.data = n.data ? n.data : {};
      return n;
    });

    this.graph = {
      nodes: this.nodes,
      edges: this.links
    };

    requestAnimationFrame(() => this.draw());
  }
  /**
   * Draws the graph
   *
   *
   * @memberOf GraphComponent
   */
  draw(): void {
    console.log("drawing graph");
    if (!this.layout || typeof this.layout === 'string') {
      return;
    }
    // Calc view dims for the nodes
    this.applyNodeDimensions();

    // Recalc the layout
    const result$ = this.layout.run(this.graph, this.computePositionsAfterCollapse);

    this.graphSubscription.add(result$.subscribe(graph => {
      this.graph = graph; // assign the newly computed graph
      this.tick();
    }));

    result$
      //.pipe(first(graph => graph.nodes.length > 0))
      .subscribe(() => this.applyNodeDimensions()); // recompute the dimensions of the new graph
  }
  /**
   * Each animation tick
   *
   *
   * @memberOf GraphComponent
   */
  tick() {
    // Transposes view options to the node
    this.graph.nodes.forEach(n => { // put the node in its computed position
      n.oldTransform = n.transform;
      n.transform = `translate(${n.position.x - n.dimension.width / 2 || 0}, ${n.position.y - n.dimension.height / 2 || 0})`;
    });

    this.graph.edges.forEach(edge => {
      if(!edge.points) {
        console.log("problems with this edge");
        console.log(edge);
      }
      edge.oldLine = edge.line;
      edge.line = this.generateLine(edge.points);
      if(!edge.oldLine) { // if it didn't have a line before
        edge.oldLine = edge.line;
      }

      // const textPos = edge.points[Math.floor(edge.points.length / 2)];
      // if(textPos) {
      //   edge.textTransform = `translate(${textPos.x || 0},${textPos.y || 0})`;
      // }

      edge.textAngle = 0;

      // compute textpath orientation
      this.calcDominantBaseline(edge);
    });

    // Calculate the height/width total
    if(this.graph.nodes.length > 0) {
      this.graphDims.width = Math.max(...this.graph.nodes.map(n => n.position.x + n.dimension.width));
      this.graphDims.height = Math.max(...this.graph.nodes.map(n => n.position.y + n.dimension.height));
    }

    if (this.autoZoom) {
      this.zoomToFit();
    }

    if (this.autoCenter) {
      // Auto-center when rendering
      // this.center();
    }

    requestAnimationFrame(() => {
      this.redrawLines();
      this.redrawNodes();
    });
    this.cd.markForCheck();
  }

  /* ================================================================================================== */
  /* Drawing and Updating Nodes
  /* ================================================================================================== */
  /**
   * Measures the node element and applies the dimensions
   *
   * @memberOf GraphComponent
   */
  applyNodeDimensions(): void {

    if (this.nodeElements && this.nodeElements.length) { // make sure that the node template has been inflated for all nodes
      this.nodeElements.forEach(elem => {
        const nativeElement = elem.nativeElement; // retrieve the element template
        const node = this.graph.nodes.find(n => n.id === nativeElement.id); // get the data of the node

        // calculate the height
        let dims;
        try {
          // dims = nativeElement.getBoundingClientRect();
          dims = nativeElement.getBBox();
        } catch (ex) {
          // Skip drawing if element is not displayed - Firefox would throw an error here
          return;
        }
        // Compute Height
        if (this.nodeHeight) { // if the nodes height has been defined by the user then assign it to the node data
          node.dimension.height = this.nodeHeight;
        } else { // else get the height computed by the template and assign it to the node
          node.dimension.height = dims.height;
        }
        // Check the heigh is within the user defined max and min if any.
        if (this.nodeMaxHeight) node.dimension.height = Math.max(node.dimension.height, this.nodeMaxHeight);
        if (this.nodeMinHeight) node.dimension.height = Math.min(node.dimension.height, this.nodeMinHeight);

        // Compute Width
        if (this.nodeWidth) { // if the nodes width has been defined by the user then assign it to the node data
          node.dimension.width = this.nodeWidth;
        } else { // else get the width computed by the template and assign it to the node
          // calculate the width
          if (nativeElement.getElementsByTagName('text').length) { // if the template has a text element then use its width
            let textDims;
            try {
              textDims = nativeElement.getElementsByTagName('text')[0].getBBox();
            } catch (ex) {
              // Skip drawing if element is not displayed - Firefox would throw an error here
              return;
            }
            node.dimension.width = textDims.width + 20;
          } else { // else the template does not have a text, then give it the default one given by the template
            node.dimension.width = dims.width;
          }
        }
        // Check the width is within the user defined max and min if any.
        if (this.nodeMaxWidth) node.dimension.width = Math.min(node.dimension.width, this.nodeMaxWidth);
        if (this.nodeMinWidth) node.dimension.width = Math.max(node.dimension.width, this.nodeMinWidth);
      });
    }
  }
  /**
   * Redraws the nodes when position changes
   *
   * @param {boolean} [animate=true]
   *
   * @memberOf GraphComponent
   */
  redrawNodes(_animate = true): void {

    this.graph.nodes.forEach(node => {
      this.redrawNode(node, _animate);
    });

  }
  redrawNode(node, _animate): void {
    const nodeEl = this.nodeElements.find(nodeEl => node.id === nodeEl.nativeElement.id);
    if(nodeEl) {
      const nodeSelection = select(nodeEl.nativeElement);
      nodeSelection
        .attr('transform', node.oldTransform)
        .transition()
        .duration(_animate ? 500 : 0)
        .attr('transform', node.transform);
    }
  }
  /**
   * Tracking for the node
   *
   * @param {any} index
   * @param {any} node
   * @returns {*}
   *
   * @memberOf GraphComponent
   */
  trackNodeBy(index, node): any {
    return node.id;
  }
  /* ================================================================================================== */
  /* Drawing and Updating Lines
  /* ================================================================================================== */
  /**
   * Calculate the text directions / flipping
   *
   * @param {any} link
   *
   * @memberOf GraphComponent
   */
  calcDominantBaseline(link): void {
    const firstPoint = link.points[0];
    const lastPoint = link.points[link.points.length - 1];

    link.oldTextPath = link.textPath;

    if (lastPoint.x < firstPoint.x) {
      link.dominantBaseline = 'text-before-edge';

      // reverse text path for when its flipped upside down
      link.textPath = this.generateLine([...link.points].reverse());
    } else {
      link.dominantBaseline = 'text-after-edge';
      link.textPath = link.line;
    }
  }
  /**
   * Generate the new line path
   *
   * @param {any} points
   * @returns {*}
   *
   * @memberOf GraphComponent
   */
  generateLine(points): any {
    const lineFunction = shape
      .line<any>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(this.curve);
    return lineFunction(points);
  }

  redrawEdge(edge: Edge) {
    const line = this.generateLine(edge.points);
    this.calcDominantBaseline(edge);
    edge.oldLine = edge.line;
    edge.line = line;
  }
  /**
   * Redraws the lines when dragged or viewport updated
   *
   * @param {boolean} [animate=true]
   *
   * @memberOf GraphComponent
   */
  redrawLines(_animate = true): void {
    this.graph.edges.forEach(edge => this.redrawLine(edge,_animate));
  }

  redrawLine(edge,_animate): void {
    const linkEl = this.linkElements.find(linkEl => edge.id === linkEl.nativeElement.id);
    if(linkEl) {
      const linkSelection = select(linkEl.nativeElement).select('.line');
      linkSelection
        .attr('d', edge.oldLine)
        .transition()
        .duration(_animate ? 500 : 0)
        .attr('d', edge.line);

      const textPathSelection = select(this.chartElement.nativeElement).select(`#${edge.id}`);
      textPathSelection
        .attr('d', edge.oldTextPath)
        .transition()
        .duration(_animate ? 500 : 0)
        .attr('d', edge.textPath);
    }
  }
  /**
   * Tracking for the link
   *
   * @param {any} index
   * @param {any} link
   * @returns {*}
   *
   * @memberOf GraphComponent
   */
  trackLinkBy(index, link): any {
    return link.id;
  }
  /* ================================================================================================== */
  /* Updating Graph
  /* ================================================================================================== */
  update(): void {
    super.update();
    console.log("updating");
    this.zone.run(() => {
      this.dims = calculateViewDimensions({
        width: this.width,
        height: this.height,
        margins: this.margin
      });

      this.createGraph();
      this.updateTransform();
      this.initialized = true;
    });
  }
  /**
   * Update the entire view for the new pan position
   *
   *
   * @memberOf GraphComponent
   */
  updateTransform(): void {
    this.transform = toSVG(this.transformationMatrix);
  }

  applyStyleToSpecificNodesAndEdges(nodes:string[], edges:string[], style:string, remove:boolean=false) {
    this.nodeElements.forEach((el) => {
      if(nodes.includes(el.nativeElement.id)) { // nodes to be styled
        if(remove) {
          this.renderer.removeClass(el.nativeElement, style);
        } else {
          this.renderer.addClass(el.nativeElement, style);
        }
      }
    });
    this.linkElements.forEach((el) => {
      if(edges.includes(el.nativeElement.id)) { // edges to be styled
        if(remove) {
          this.renderer.removeClass(el.nativeElement, style);
        } else {
          this.renderer.addClass(el.nativeElement, style);
        }
      }
    });
  }

  getPathsToNode(nodeID:string, edges:Edge[]):string[] {
    let pathIDs:string[] = [];
    let childrenIDs:string[] = edges.filter((e) => e.target === nodeID).map((e) => e.source);
    if(!childrenIDs.length) { // no more children, stopping condition
      return pathIDs;
    }
    pathIDs.push(...childrenIDs);
    childrenIDs.forEach((id) => {
      pathIDs.push(...this.getPathsToNode(id, edges));
    });
    return pathIDs;
  }

  /* ================================================================================================== */
  /* Mouse Events on Background
  /* ================================================================================================== */
  /**
   * On mouse move event, used for panning and dragging.
   *
   * @param {MouseEvent} $event
   *
   * @memberOf GraphComponent
   */
  @HostListener('document:mousemove', ['$event'])
  onMouseMove($event: MouseEvent): void {
    if (this.isPanning && this.panningEnabled) {
      this.onPan($event);
    } else if (this.isDragging && this.draggingEnabled) {
      this.onDrag($event);
    }
  }
  /**
   * On touch start event to enable panning.
   *
   * @param {TouchEvent} $event
   *
   * @memberOf GraphComponent
   */
  onTouchStart(event) {
    this._touchLastX = event.changedTouches[0].clientX;
    this._touchLastY = event.changedTouches[0].clientY;
    this.isPanning = true;
  }
  /**
   * On touch move event, used for panning.
   *
   * @param {TouchEvent} $event
   *
   * @memberOf GraphComponent
   */
  @HostListener('document:touchmove', ['$event'])
  onTouchMove($event: TouchEvent): void {
    if (this.isPanning && this.panningEnabled) {
      const clientX = $event.changedTouches[0].clientX;
      const clientY = $event.changedTouches[0].clientY;
      const movementX = clientX - this._touchLastX;
      const movementY = clientY - this._touchLastY;
      this._touchLastX = clientX;
      this._touchLastY = clientY;

      this.pan(movementX, movementY);
    }
  }
  /**
   * On touch end event to disable panning.
   *
   * @param {TouchEvent} $event
   *
   * @memberOf GraphComponent
   */
  onTouchEnd(event) {
    this.isPanning = false;
  }
  /**
   * On mouse up event to disable panning/dragging.
   *
   * @param {MouseEvent} event
   *
   * @memberOf GraphComponent
   */
  @HostListener('document:mouseup')
  onMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    this.isPanning = false;
    if (this.layout && typeof this.layout !== 'string' && this.layout.onDragEnd) {
      this.layout.onDragEnd(this.draggingNode, event);
    }
    // force the mouse leave event
    this.onNodeMouseLeave(null,null);
  }

  /* ================================================================================================== */
  /* Mouse Events on Node
  /* ================================================================================================== */
  /**
   * Node was clicked
   *
   * @param {any} event
   * @returns {void}
   *
   * @memberOf GraphComponent
   */
  onClick(event): void {

  }

  /**
   * Node was double clicked
   *
   * @param {any} event
   * @param {*} node
   * @returns {void}
   *
   * @memberOf GraphComponent
   */
  onNodeDoubleClick(event: MouseEvent, node:any): void {

    let nodeIDsToCollapse = this.getPathsToNode(node.id, this.graph.edges);
    let nodesToCollapse = this.graph.nodes.filter((n) => nodeIDsToCollapse.includes(n.id));
    let edgesToCollapse = this.graph.edges.filter((e) => nodeIDsToCollapse.includes(e.target) || nodeIDsToCollapse.includes(e.source));

    // uncollapse only if all children are collapsed
    let collapse:boolean = (nodesToCollapse.filter(n => {return n.collapsed}).length == nodesToCollapse.length)? false: true;
    // except if the direct children are not collapsed;
    let directChildrenIDs = edgesToCollapse.filter((e) => e.target == node.id).map((e) => e.source);
    let directChildNotCollapsed = this.graph.nodes.filter((n) => directChildrenIDs.includes(n.id)).find((n) => {return !n.collapsed});
    if(directChildNotCollapsed) {
      console.log("child not collapse");
      collapse = true;
    } else {
      collapse = false;
    }

    nodesToCollapse.forEach((n) => {
      n.collapsed = collapse;
    });

    // toogling edges collapse
    edgesToCollapse.forEach((e) => {
      e.collapsed = collapse;
      if(!collapse) {
        // making sure that the target of each edge is not collapsed, otherwise the edge needs to stay collapsed;
        const target = this.graph.nodes.find(n => {return n.id == e.target});
        if(!target || target.collapsed) { // the target is collapsed, the edge stays collapsed
          e.collapsed = true;
        }
      }
    });


    if(this.computePositionsAfterCollapse) {
      // recompute positions;
      this.update();
    }
  }


  /**
   * On node mouse down to kick off dragging
   *
   * @param {MouseEvent} event
   * @param {*} node
   *
   * @memberOf GraphComponent
   */
  onNodeMouseDown(event: MouseEvent, node: Node): void {
    if (!this.draggingEnabled) {
      return;
    }
    this.isDragging = true;
    this.draggingNode = node;

    if (this.layout && typeof this.layout !== 'string' && this.layout.onDragStart) {
      this.layout.onDragStart(node, event);
    }
  }

  onNodeMouseEnter(event: MouseEvent, node:Node): void {
      // Find all nodes linking to this node
      if(!this.hoveringEnabled || this.isDragging) {
        return;
      }

      let nodeIDsToHighlight = this.getPathsToNode(node.id, this.graph.edges);
      nodeIDsToHighlight.push(node.id);
      let nodesToNotHighlight = this.graph.nodes.filter((n) => !nodeIDsToHighlight.includes(n.id));
      nodesToNotHighlight.forEach((n) => {
        n.unhighlight = true;
      });
      let nodeIDsToNotHighlight = nodesToNotHighlight.map(n => n.id);


      let edgeIDsToNotHighlight = this.graph.edges.filter((e) => !nodeIDsToHighlight.includes(e.target))
          .forEach((e) => {
            e.unhighlight = true;
          });

      //this.applyStyleToSpecificNodesAndEdges(nodeIDsToNotHighlight, edgeIDsToNotHighlight, "unhighlight");
  }

  onNodeMouseLeave(event: MouseEvent, node:Node): void {
    if(!this.hoveringEnabled || this.isDragging) {
      return;
    }

    this.graph.nodes.forEach((n) => {
      n.unhighlight = false;
    });
    this.graph.edges.forEach((e) => {
      e.unhighlight = false;
    });
  }

  /**
   * Node was focused
   *
   * @param {any} event
   * @returns {void}
   *
   * @memberOf GraphComponent
   */
  onActivate(event): void {

  }

  /**
   * Node was defocused
   *
   * @param {any} event
   *
   * @memberOf GraphComponent
   */
  onDeactivate(event): void {
  }

  /* ================================================================================================== */
  /* Zooming behavior
  /* ================================================================================================== */
  /**
   * Get the current zoom level
   */
  get zoomLevel() {
    return this.transformationMatrix.a;
  }
  /**
   * Set the current zoom level
   */
  @Input('zoomLevel')
  set zoomLevel(level) {
    this.zoomTo(Number(level));
  }
  /**
   * Zoom was invoked from event
   *
   * @param {MouseEvent} $event
   * @param {any} direction
   *
   * @memberOf GraphComponent
   */
  onZoom($event: MouseEvent, direction): void {
    const zoomFactor = 1 + (direction === 'in' ? this.zoomSpeed : -this.zoomSpeed);

    // Check that zooming wouldn't put us out of bounds
    const newZoomLevel = this.zoomLevel * zoomFactor;
    if (newZoomLevel <= this.minZoomLevel || newZoomLevel >= this.maxZoomLevel) {
      return;
    }

    // Check if zooming is enabled or not
    if (!this.enableZoom) {
      return;
    }

    if (this.panOnZoom === true && $event) {
      // Absolute mouse X/Y on the screen
      const mouseX = $event.clientX;
      const mouseY = $event.clientY;

      // Transform the mouse X/Y into a SVG X/Y
      const svg = this.chart.nativeElement.querySelector('svg');
      const svgGroup = svg.querySelector('g.chart');

      const point = svg.createSVGPoint();
      point.x = mouseX;
      point.y = mouseY;
      const svgPoint = point.matrixTransform(svgGroup.getScreenCTM().inverse());

      // Panzoom
      const NO_ZOOM_LEVEL = 1;
      this.pan(svgPoint.x, svgPoint.y, NO_ZOOM_LEVEL);
      this.zoom(zoomFactor);
      this.pan(-svgPoint.x, -svgPoint.y, NO_ZOOM_LEVEL);
    } else {
      this.zoom(zoomFactor);
    }
  }
  /**
   * Zoom by a factor
   *
   * @param factor Zoom multiplicative factor (1.1 for zooming in 10%, for instance)
   */
  zoom(factor: number): void {
    this.transformationMatrix = transform(this.transformationMatrix, scale(factor, factor));
    this.updateTransform();
  }
  /**
   * Zoom to a fixed level
   *
   * @param level
   */
  zoomTo(level: number): void {
    this.transformationMatrix.a = isNaN(level) ? this.transformationMatrix.a : Number(level);
    this.transformationMatrix.d = isNaN(level) ? this.transformationMatrix.d : Number(level);
    this.updateTransform();
  }
  /**
  * Zooms to fit the entier graph
  */
 zoomToFit(): void {
   const heightZoom = this.dims.height / this.graphDims.height;
   const widthZoom = this.dims.width / this.graphDims.width;
   const zoomLevel = Math.min(heightZoom, widthZoom, 1);
   if (zoomLevel !== this.zoomLevel) {
     this.zoomLevel = zoomLevel;
     this.updateTransform();
     this.center();
   }
 }
  /* ================================================================================================== */
  /* Panning behavior
  /* ================================================================================================== */
  /**
   * Pan was invoked from event
   *
   * @param {any} event
   *
   * @memberOf GraphComponent
   */
  onPan(event): void {
    this.pan(event.movementX, event.movementY);
  }
  /**
   * Pan by x/y
   *
   * @param x
   * @param y
   */
  pan(x: number, y: number, zoomLevel: number = this.zoomLevel): void {
    this.transformationMatrix = transform(this.transformationMatrix, translate(x / zoomLevel, y / zoomLevel));
    this.updateTransform();
  }

  /**
   * Pan to a fixed x/y
   *
   * @param x
   * @param y
   */
  panTo(x: number, y: number): void {
    this.transformationMatrix.e = x === null || x === undefined || isNaN(x) ? this.transformationMatrix.e : Number(x);
    this.transformationMatrix.f = y === null || y === undefined || isNaN(y) ? this.transformationMatrix.f : Number(y);
    this.updateTransform();
  }

  /* ================================================================================================== */
  /* Dragging behavior
  /* ================================================================================================== */
  /**
   * Drag was invoked from an event
   *
   * @param {any} event
   *
   * @memberOf GraphComponent
   */
  onDrag(event): void {
    if (!this.draggingEnabled) {
      return;
    }
    const node = this.draggingNode;
    if (this.layout && typeof this.layout !== 'string' && this.layout.onDrag) {
      this.layout.onDrag(node, event);
    }

    node.position.x += event.movementX / this.zoomLevel;
    node.position.y += event.movementY / this.zoomLevel;

    // move the node
    const x = node.position.x - node.dimension.width / 2;
    const y = node.position.y - node.dimension.height / 2;

    node.transform = `translate(${x}, ${y})`;
    this.redrawNode(node, false);

    for (const link of this.graph.edges) {
      if (
        link.target === node.id || link.source === node.id ||
        (link.target as any).id === node.id || (link.source as any).id === node.id
      ) {
        if (this.layout && typeof this.layout !== 'string') {
          const result$ = this.layout.updateEdge(this.graph, link);
          this.graphSubscription.add(result$.subscribe(graph => {
            this.graph = graph;
            this.redrawEdge(link);
            this.redrawLine(link,false);
          }));
        }
      }
    }
  }


  /* ================================================================================================== */
  /* Fab Menu
  /* ================================================================================================== */
  fabOpen = true;

  openFAB():void{
    this.fabOpen = !this.fabOpen;
  }

}
