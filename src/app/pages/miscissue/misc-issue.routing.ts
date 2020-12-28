import { RouterModule, Routes } from "@angular/router";
import { MiscIssueComponent } from './misc-issue.component';
import { CreateMiscIssueComponent } from './create-misc-issue/create-misc-issue.component';
import { MiscIssueListComponent } from './misc-issue-list/misc-issue-list.component';

const route: Routes = [
    {
        path: '',
        component: MiscIssueComponent,
        children: [
            {
              path: 'create',
              component: CreateMiscIssueComponent,
            },
            {
              path: 'list',
              component: MiscIssueListComponent,
            },
            {
              path: 'edit/:issueId',
              component: CreateMiscIssueComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:issueId',
              component: CreateMiscIssueComponent,
              data: {viewMode: true},
            },
            {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full'
            }
        ]
    }
];
export const IssueRouting = RouterModule.forChild(route);