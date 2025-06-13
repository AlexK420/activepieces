import {
    Flow,
    Issue,
    IssueStatus, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    TIMESTAMP_COLUMN_TYPE,
} from '../../database/database-common'


type IssueSchema = Issue & {
    project: Project
    flow: Flow
}

export const IssueEntity = new EntitySchema<IssueSchema>({
    name: 'issue',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
        },
        flowId: {
            ...ApIdSchema,
        },
        status: {
            type: String,
            enum: IssueStatus,
        },
        lastOccurrence: {
            type: TIMESTAMP_COLUMN_TYPE,
        },
        stepName: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_issue_flowId_stepId',
            columns: ['flowId', 'stepName'],
        },
    ],
    relations: {
        flow: {
            type: 'one-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_issue_flow_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onUpdate: 'RESTRICT',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_issue_project_id',
            },
        },
    },
})


