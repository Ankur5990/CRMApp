import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { MiscIssueService } from './misc-issue.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class MiscIssueComponent {
    constructor(private issueService: MiscIssueService, private userService: UserService) { 
        const now = new Date();
        let issueListTask = this.issueService.getIssueObject();
        let createIssueTask = this.issueService.getIssueObject();
        issueListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        issueListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        issueListTask.CustomerName = '';
        issueListTask.Status = '';

        createIssueTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createIssueTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createIssueTask.CustomerName = '';
        createIssueTask.Status = '';
    }
	
}