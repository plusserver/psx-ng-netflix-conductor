import { NgModule, ModuleWithProviders } from '@angular/core';
import { TaskMetadataManagerService } from './service/task-metadata-manager.service';
import { WorkflowMetadataManagerService } from './service/workflow-metadata-manager.service';
import { WorkflowManagerService } from './service/worflow-manager.service';
import { ConductorSDKOptions } from './types';
import { APP_CONFIG } from './config';
import { HttpClientModule } from '@angular/common/http';




@NgModule({
  imports: [
    HttpClientModule
  ]
})
export class NetflixConductorModule {

  static forRoot(config: ConductorSDKOptions): ModuleWithProviders<NetflixConductorModule> {
    return {
      ngModule: NetflixConductorModule,
      providers: [
        TaskMetadataManagerService,
        WorkflowMetadataManagerService,
        WorkflowManagerService,
        { provide: APP_CONFIG, useValue: config },
      ]
    };
  }
}
