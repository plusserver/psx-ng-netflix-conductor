import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { APP_CONFIG } from '../config';
import { ConductorSDKOptions, TaskDefinition, TaskMetadataDefinition } from '../types';

@Injectable({
  providedIn: 'root'
})
export class TaskMetadataManagerService {
  public apiEndpoint: string;

  constructor(@Inject(APP_CONFIG) options: ConductorSDKOptions, protected client: HttpClient) {
    const { apiEndpoint } = options;
    if (!apiEndpoint) {
      throw new Error('no apiEndpoint given!')
    }
    this.apiEndpoint = apiEndpoint;
  }

  getAllTasks(): Observable<TaskDefinition[]> {
    return this.client.get<TaskDefinition[]>(this.apiEndpoint + '/metadata/taskdefs');
  }

  getTask(taskType: string): Observable<TaskDefinition> {
    return this.client.get<TaskDefinition>(this.apiEndpoint + `/metadata/taskdefs/${taskType}`)
  }

  registerTask(task: TaskMetadataDefinition): Observable<TaskDefinition> {
    const subject = new Subject<TaskDefinition>();
    this.client.post<TaskDefinition[]>(`/metadata/taskdefs`, [task]).subscribe(() => {
      this.getTask(task.name).subscribe((taskResponse: TaskDefinition) => {
        if (taskResponse.name === task.name) {
          subject.error('Create a task, but can not find task');
          return;
        }
        subject.next(task);
      },
        (err) => {
          subject.error(err);
        });
    });
    return subject;
  }

  registerTasks(tasks: TaskMetadataDefinition[]): Observable<TaskDefinition[]> {
    return this.client.post<TaskDefinition[]>(this.apiEndpoint + `/metadata/taskdefs`, tasks);
  }

  deleteTask(taskType: string) {
    return this.client.delete<TaskDefinition>(this.apiEndpoint + `/metadata/taskdefs/${taskType}`);
  }

  updateTask(task: TaskMetadataDefinition): Observable<void> {
    return this.client.put<void>(this.apiEndpoint + `/metadata/taskdefs`, task);
  }

  isExist(name: string): Observable<boolean> {
    const subject = new Subject<boolean>();
    this.getTask(name).subscribe((task) => {
      if (task) {
        subject.next(true);
        return;
      }
      subject.next(false);
    }, () => {
      subject.next(false);
    });
    return subject;

  }

  registerOrUpdateTask(task: TaskMetadataDefinition) {
    var subject = new Subject<TaskDefinition>();
    this.isExist(task.name).subscribe(async (isExist: boolean) => {
      if (isExist) {
        await this.updateTask(task).toPromise();
      } else {
        await this.registerTask(task).toPromise();
      }
      subject.next(await this.getTask(task.name).toPromise());
    });
    return subject;
  }
}
