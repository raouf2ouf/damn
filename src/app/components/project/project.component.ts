import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { MatDialog, MatDialogConfig } from '@angular/material';

import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { AuthenticationService } from '../../security';
import { AlertService, ProjectService, CollaborationService, SgService } from '../../services';
import { Project, Statement, Agent, KnowledgeBase } from '../../models';

import { AgentDialogComponent } from '../../components/dialogs';

import { Subscription } from 'rxjs';



import {saveAs as importedSaveAs} from "file-saver";

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit, OnDestroy {
  project: Project;
  subscriptions:Subscription[] = [];

  agent:Agent;

  loading:boolean = true;

  semantics = [
    {name:"Ambiguity Blocking without Team Defeat", value: "BDLwithoutTD"},
    {name:"Ambiguity Blocking with Team Defeat", value: "BDLwithTD"},
    {name:"Ambiguity Propagating without Team Defeat", value: "PDLwithoutTD"},
    {name:"Ambiguity Propagating with Team Defeat", value: "PDLwithTD"}
  ];


  constructor(public alertService: AlertService,
    public projectService: ProjectService,
    public collaborationService:CollaborationService,
    public sgService:SgService,
    public authenticationService: AuthenticationService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router:Router) { }

  ngOnInit() {
    this.agent = this.authenticationService.getLoggedUser();
    this.route.params.subscribe(params => {
      this.getProject(params['id']);
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => {
      s.unsubscribe();
    })
  }


  getProject(id:string): void {
    const sub = this.projectService.getProject(id).subscribe(res => {
      // activate collaboration
      this.collaborationService.connect();

      this.project = res;
      if(!this.project.semantic) this.project.semantic = this.semantics[0].value;

      let broadcastWatch = this.collaborationService.watch(this.project.id).subscribe((payload) => {
        this.updateKB(JSON.parse(payload.body));
      });
      this.subscriptions.push(broadcastWatch);

      let deleteWatch = this.collaborationService.watch(`${this.project.id}/delete`).subscribe(payload => {
        let kb = JSON.parse(payload.body);
        this.project.kbs = this.project.kbs.filter(k => k.id !== kb.id);
      });
      this.subscriptions.push(deleteWatch);

      this.loading = false;
    },
    error => {
      this.alertService.error(error);
    });

    this.subscriptions.push(sub);
  }


  build():void {
    let kbs:KnowledgeBase[] = [];
    this.project.kbs.forEach(k => {
      if(k.selected) {
        kbs.push(k);
      }
    });
    this.sgService.build(kbs, this.project.id).subscribe(res => {
      this.sgService.onGetData.emit(res);
      this.alertService.success("Building the combined knowledge ended successfully!");
    }, error => {
      this.alertService.error(error);
    })
  }

  answerQuery():void {
    let kbs:KnowledgeBase[] = [];
    this.project.kbs.forEach(k => {
      if(k.selected) {
        kbs.push(k);
      }
    });
    this.sgService.query(kbs, this.project.id, this.project.query, this.project.semantic).subscribe(res => {
      this.sgService.onGetData.emit(res);
      this.alertService.success("Quering the combined knowledge ended successfully!");
    }, error => {
      this.alertService.error(error);
    })
  }

  ////////////////////////////////////////////////////////////////
  // Project Menu actions
  ////////////////////////////////////////////////////////////////

  addOrEditLocalAgent(kb=null) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    if(kb) {
      dialogConfig.data = {
        name: kb.source
      }
    }
    const dialogRef = this.dialog.open(AgentDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(data => {
      let kbToSave = null;
      if(data) {
        if(kb) {
          kb.source = data.name;
          kbToSave = kb;
        } else {
          kbToSave = new KnowledgeBase();
          kbToSave.source = data.name;
          if(this.agent) {
            kbToSave.agent_id = this.agent.id
          }
        }
        this.saveKB(kbToSave);
      }
    });
  }
  // File Import/Export
  exportProjectToFile(a) {
    // Update the save to local file button
    let theJSON = JSON.stringify(this.project);
    let blob = new Blob([theJSON], { type: 'text/json' });
    importedSaveAs(blob, this.project.name+".json");
  }

  importProjectFromFile($event):void {
    let file = $event.srcElement.files[0];
    let reader = new FileReader();
    reader.readAsText(file);

    reader.onload = (data) => {
      let json = JSON.parse(reader.result.toString());
      this.project.kbs = json.kbs;
      if(json.query) this.project.query = json.query;
      if(json.semantic) this.project.semantic = json.semantic;
    }
  }


  ////////////////////////////////////////////////////////////////
  // Agent's KNowledge Menu actions
  ////////////////////////////////////////////////////////////////
  selectAllKBs():void {
    let isSelected = false;
    if(this.project.kbs.some(kb => kb.selected === false)) {
      isSelected = true;
    }
    this.project.kbs.forEach(kb => {
      kb.selected = isSelected;
    });
  }

  saveAllKBs():void {
    this.project.kbs.forEach(kb => {
      this.saveKB(kb);
    })
  }

  saveKB(kb:KnowledgeBase):void {
    this.collaborationService.saveKB(this.project.id, kb).subscribe(res => {
      this.updateKB(res);
      this.alertService.success(`The knowledge of ${kb.source} has been updated!`);
    }, error => {
      this.alertService.error(error);
    });
  }

  getKB(id:string):void {
    this.collaborationService.getKB(this.project.id, id).subscribe(kb => {
      this.updateKB(kb);
      this.alertService.success(`Rollingback the knowledge of ${kb.source} to the last saved version.`);
    }, error => {
      this.alertService.error(error);
    })
  }
  updateKB(kb:KnowledgeBase) {
    let kbToUpdate = this.project.kbs.find(k => k.id === kb.id);
    if(!kbToUpdate) { // maybe this kb correspond to a kb without an id;
      kbToUpdate = this.project.kbs.find(k => k.source === kb.source);
    }
    if(kbToUpdate) {
      kbToUpdate.id = kb.id;
      kbToUpdate.dlgp = kb.dlgp;
      kbToUpdate.source = kb.source;
      kbToUpdate.agent_id = kb.agent_id;
      kbToUpdate.editors = kb.editors;
    } else {
      this.project.kbs.push(kb);
    }
  }

  deleteKB(kb:KnowledgeBase) {
    if(confirm("Are you sure to delete '"+kb.source + "''?")) {
      this.collaborationService.deleteKB(this.project.id, kb).subscribe(res => {
        this.project.kbs = this.project.kbs.filter(k => k.id !== kb.id);
      }, error => {
        this.alertService.error(error)
      });
    }
  }
}
