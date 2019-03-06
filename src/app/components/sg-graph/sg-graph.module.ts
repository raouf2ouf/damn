import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChartCommonModule } from '@swimlane/ngx-charts';

import { GraphComponent } from './graph/graph.component';
import { MouseWheelDirective } from './graph/mouse-wheel.directive';

import { LayoutService } from './layout';

import {EcoFabSpeedDialModule} from '@ecodev/fab-speed-dial';
// Angular material
import { MatButtonModule, MatIconModule, MatTooltipModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    ChartCommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EcoFabSpeedDialModule
  ],
  exports: [GraphComponent, MouseWheelDirective],
  declarations: [GraphComponent, MouseWheelDirective],
  providers: [LayoutService],
})
export class SgGraphModule { }
