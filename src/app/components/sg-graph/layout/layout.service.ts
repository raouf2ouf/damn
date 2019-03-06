import { Injectable } from '@angular/core';

import {Layout} from '../model';
import {DagreLayout} from './dagre.layout';
import {D3ForceDirectedLayout} from './d3-force-directed.layout';

const layouts = {
  dagre: DagreLayout,
  d3ForceDirected: D3ForceDirectedLayout
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  getLayout(name:string): Layout {
    if(layouts[name]) {
      return new layouts[name]();
    } else {
      throw new Error(`Unknown layout type '${name}'`);
    }
  }
}
