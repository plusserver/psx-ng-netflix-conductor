import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { ConductorSDKOptions, StartWorkflowOptions, Workflow } from '../types';
import { APP_CONFIG } from '../config';
import { Observable, Subject } from 'rxjs';

interface RerunWorkflowOptions {
  reRunFromWorkflowId: string,
  workflowInput: any,
  reRunFromTaskId: string,
  taskInput: any
}

interface SkipWorkflowTaskOptions {
  taskReferenceName: string,
  taskInput: any,
  taskOutput: any,
}

@Injectable({
  providedIn: 'root'
})
export class WorflowManagerService {

  public apiEndpoint: string

  constructor(@Inject(APP_CONFIG) options: ConductorSDKOptions, protected client: HttpClient) {

    const { apiEndpoint } = options;
    if (!apiEndpoint) {
      throw new Error('no apiEndpoint given!')
    }
    this.apiEndpoint = apiEndpoint;
  }
  /**
   * Get Workflow State by workflow Id. If includeTasks is set, then also includes all the tasks executed and scheduled.
   */
  retrieveWorkflow(workflowId: string, includeTasks = false): Observable<Workflow> {
    const params = new HttpParams();
    params.append('includeTasks', includeTasks ? 'true' : 'false');
    return this.client.get<Workflow>(this.apiEndpoint + '/workflow/' + workflowId, { params });
  }

  startWorkflow(options: StartWorkflowOptions): Observable<Workflow> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'text/html, application/xhtml+xml, */*',
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      responseType: 'text'
    };
    const subject = new Subject<Workflow>();
    this.client.post<string>(this.apiEndpoint + '/workflow', httpOptions ).subscribe(
      (workflowId: string) => {
        this.retrieveWorkflow(workflowId).subscribe((workflow: Workflow) => {
          if (workflow.workflowId === workflowId) {
            subject.error('Start a workflow, but can not find it');
            return;
          }
          subject.next(workflow);
        }, (err) => {
          subject.error(err)
        }
        );
      }, (err) => {
        subject.error(err)
      }
    );
    return subject;
  }

  terminateWorkflow(workflowId: string): Observable<Workflow> {
    const subject = new Subject<Workflow>();
    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.delete<string>(this.apiEndpoint + '/workflow/' + workflowId).subscribe(
          () => {
            subject.next(workflow)
          },
          (err) => {
            subject.error(err)
          }
        );
      },
      (err) => {
        subject.error(err)
      }
    );
    return subject;
  }

  removeWorkflow(workflowId: string): Observable<Workflow> {
    const subject = new Subject<Workflow>();
    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.delete<string>(this.apiEndpoint + '/workflow/' + workflow.workflowId + '/remove').subscribe(
          () => {
            subject.next(workflow);
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

  /**
   * Pause. No further tasks will be scheduled until resumed. Currently running tasks are not paused.
   * @param workflowId
   */
  pauseWorkflow(workflowId: string): Observable<Workflow> {
    const subject = new Subject<Workflow>();
    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.put<string>(this.apiEndpoint + '/workflow/' + workflowId + '/pause', {}).subscribe(
          () => {
            subject.next(workflow)
          }, (err) => {
            subject.error(err)
          }
        );
      }, (err) => {
        subject.error(err)
      }
    );

    return subject;
  }

  /**
   * Resume normal operations after a pause.
   * @param workflowId
   */
  resumeWorkflow(workflowId: string) {
    const subject = new Subject<Workflow>();
    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.put<string>(this.apiEndpoint + '/workflow/' + workflowId + '/resume', {}).subscribe(
          () => {
            subject.next(workflow)
          }, (err) => {
            subject.error(err)
          }
        );
      }, (err) => {
        subject.error(err)
      }
    );
    return subject;
  }

  /**
   * Re-runs a completed workflow from a specific task.
   * @param workflowId
   * @param options
   */
  rerunWorkflow(workflowId: string, options: RerunWorkflowOptions) {
    const subject = new Subject<Workflow>();
    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.put<string>(this.apiEndpoint + '/workflow/' + workflowId + '/rerun', options).subscribe(
          () => {
            subject.next(workflow)
          }, (err) => {
            subject.error(err)
          }
        );
      }, (err) => {
        subject.error(err)
      }
    );
    return subject;
  }

  /**
   * Restart workflow execution from the start. Current execution history is wiped out.
   * @param workflowId
   */
  restartWorkflow(workflowId: string) {
    const subject = new Subject<Workflow>();
    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.put<string>(this.apiEndpoint + '/workflow/' + workflowId + '/restart', {}).subscribe(
          () => {
            subject.next(workflow)
          }, (err) => {
            subject.error(err)
          }
        );
      }, (err) => {
        subject.error(err)
      }
    );
    return subject;
  }

  /**
   * Retry the last failed task.
   * @param workflowId
   */
  retryWorkflow(workflowId: string) {
    const subject = new Subject<Workflow>();
    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.put<string>(this.apiEndpoint + '/workflow/' + workflowId + '/retry', {}).subscribe(
          () => {
            subject.next(workflow)
          }, (err) => {
            subject.error(err)
          }
        );
      }, (err) => {
        subject.error(err)
      }
    );
    return subject;
  }

  /**
   * Skips a task execution (specified as taskReferenceName parameter) in a running workflow and continues forward.
   * Optionally updating task's input and output as specified in the payload.
   * PUT /workflow/{workflowId}/skiptask/{taskReferenceName}?workflowId=&taskReferenceName=
   * @param workflowId
   * @param options
   */
  skipWorkflowTask(workflowId: string, options: SkipWorkflowTaskOptions) {
    const subject = new Subject<Workflow>();
    if (options.taskReferenceName) {
      subject.error('taskReferenceName should be not empty');
      return;
    }
    const { taskReferenceName, ...others } = options;

    this.retrieveWorkflow(workflowId).subscribe(
      (workflow: Workflow) => {
        this.client.put<string>(this.apiEndpoint + '/workflow/' + workflowId + '/skiptask/' + taskReferenceName, others).subscribe(
          () => {
            subject.next(workflow)
          }, (err) => {
            subject.error(err)
          }
        );
      }, (err) => {
        subject.error(err)
      }
    );
    return subject;
  }
}
