import { AppSystemProp, JobData, OneTimeJobData, OutgoingWebhookJobData, QueueName, ScheduledJobData, UserInteractionJobData, UserInteractionJobType, WebhookJobData } from '@activepieces/server-shared'
import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, WebsocketClientEvent } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { app } from '../../server'
import { machineService } from '../machine/machine-service'
import { preHandlers } from './pre-handlers'

export const jobConsumer = (log: FastifyBaseLogger) => {
    return {
        consume: async (jobId: string, queueName: QueueName, jobData: JobData, attempsStarted: number) => {
            const preHandler = preHandlers[queueName]
            const preHandlerResult = await preHandler.handle(jobData, attempsStarted, log)
            if (preHandlerResult.shouldSkip) {
                log.debug({
                    message: 'Skipping job execution',
                    reason: preHandlerResult.reason,
                    jobId,
                    queueName,
                })
                return
            }
            let workerId: string | undefined
            try {
                const { projectId, platformId } = await getProjectIdAndPlatformId(queueName, jobData)
                const engineToken = await accessTokenManager.generateEngineToken({
                    jobId,
                    projectId,
                    platformId,
                })

                workerId = await machineService(log).acquire()
                log.info({
                    message: 'Acquired worker id',
                    workerId,
                })
                const lockTimeout = dayjs.duration(jobConsumer(log).getLockDurationInMs(queueName), 'milliseconds').add(1, 'minutes').asMilliseconds()
                const request: ConsumeJobRequest = {
                    jobId,
                    queueName,
                    jobData,
                    attempsStarted,
                    engineToken,
                }
                const response: ConsumeJobResponse[] | undefined = await app!.io.to(workerId).timeout(lockTimeout).emitWithAck(WebsocketClientEvent.CONSUME_JOB_REQUEST, request)
                log.info({
                    message: 'Consume job response',
                    response,
                })
                const isInternalError = response?.[0]?.status === ConsumeJobResponseStatus.INTERNAL_ERROR
                if (isInternalError) {
                    throw new Error(response?.[0]?.errorMessage ?? 'Unknown error')
                }
            }
            finally {
                if (workerId) {
                    await machineService(log).release(workerId)
                }
            }
        },
        getLockDurationInMs(queueName: QueueName): number {
            const triggerTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS)
            const flowTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS)
            const agentTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.AGENT_TIMEOUT_SECONDS)
            const outgoingWebhookTimeout = system.getNumberOrThrow(AppSystemProp.OUTGOING_WEBHOOK_TIMEOUT_SECONDS)
            switch (queueName) {
                case QueueName.WEBHOOK:
                    return dayjs.duration(triggerTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.USERS_INTERACTION:
                    return dayjs.duration(flowTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.ONE_TIME:
                    return dayjs.duration(flowTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.SCHEDULED:
                    return dayjs.duration(triggerTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.AGENTS:
                    return dayjs.duration(agentTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.OUTGOING_WEBHOOK:
                    return dayjs.duration(outgoingWebhookTimeout, 'seconds').asMilliseconds()
            }
        },
    }
}


async function getProjectIdAndPlatformId(queueName: QueueName, job: JobData): Promise<{
    projectId: string
    platformId: string
}> {
    switch (queueName) {
        case QueueName.AGENTS:
        case QueueName.ONE_TIME:
        case QueueName.WEBHOOK:
        case QueueName.SCHEDULED: {
            const castedJob = job as OneTimeJobData | WebhookJobData | ScheduledJobData
            return {
                projectId: castedJob.projectId,
                platformId: await projectService.getPlatformId(castedJob.projectId),
            }
        }
        case QueueName.USERS_INTERACTION: {
            const userInteractionJob = job as UserInteractionJobData
            switch (userInteractionJob.jobType) {
                case UserInteractionJobType.EXECUTE_VALIDATION:
                case UserInteractionJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                    return {
                        projectId: userInteractionJob.projectId!,
                        platformId: userInteractionJob.platformId,
                    }
                default:
                    return {
                        projectId: userInteractionJob.projectId,
                        platformId: await projectService.getPlatformId(userInteractionJob.projectId),
                    }
            }
        }
        case QueueName.OUTGOING_WEBHOOK: {
            const outgoingWebhookJob = job as OutgoingWebhookJobData
            return {
                projectId: outgoingWebhookJob.projectId!,
                platformId: outgoingWebhookJob.platformId,
            }
        }
    }
}

