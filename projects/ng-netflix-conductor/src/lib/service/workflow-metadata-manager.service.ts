import { Injectable, Inject } from '@angular/core';
import { ConductorSDKOptions, WorkflowDefinition, WorkflowMetadataDefinition } from '../types';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../config';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkflowMetadataManagerService {

  public apiEndpoint: string

  constructor(@Inject(APP_CONFIG) options: ConductorSDKOptions, protected client: HttpClient) {

    const { apiEndpoint } = options;
    if (!apiEndpoint) {
      throw new Error('no apiEndpoint given!')
    }
    this.apiEndpoint = apiEndpoint;
  }

  getAllWorkflows(): Observable<WorkflowDefinition[]> {
    return this.client.get<WorkflowDefinition[]>(this.apiEndpoint +  '/metadata/workflow');
  }

  getWorkflow(name: string, version?: number): Observable<WorkflowDefinition> {
    let suffix = (version !== undefined) ? `?version=${version}` : '';
    const url = this.apiEndpoint +  `/metadata/workflow/${name}${suffix}`;
    return this.client.get<WorkflowDefinition>(url);
  }

  registerWorkflow(workflow: WorkflowMetadataDefinition): Observable<WorkflowMetadataDefinition> {
    const subject = new Subject<WorkflowMetadataDefinition>();

    this.client.post<WorkflowDefinition>(this.apiEndpoint +  `/metadata/workflow`, workflow).subscribe(
      () => {
        this.getWorkflow(workflow.name).subscribe(
          (workflowObject: WorkflowMetadataDefinition) => {
            if (workflowObject.name === workflow.name) {
              subject.error('Create a workflow, but can not find workflow');
              return;
            }
            subject.next(workflowObject);
          }, (err) => {
            subject.error(err)
          }
        );
      }, (err) => {
        subject.error(err)
      }
    )

    return subject;
  }

  registerOrUpdateWorkflow(workflow: WorkflowDefinition) {
    const name = workflow.name;
    const version = workflow.version;
    const subject = new Subject<WorkflowDefinition>();

    this.client.put<void>(this.apiEndpoint +  `/metadata/workflow`, [workflow]).subscribe(
      () => {
        this.getWorkflow(name, version).subscribe(
          (workflow: WorkflowDefinition) => {
            subject.next(workflow);
          }),
          (err) => {
            subject.error(err)
          }
      }, (err) => {
        subject.error(err)
      })
    return subject;
  }
}

