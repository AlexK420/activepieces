import { t } from 'i18next';
import { LeftSideBarType, useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarHeader } from '../sidebar-header';
import { MessageContent } from './types';
import { copilotApi } from './copilot-api';
import { useMutation } from '@tanstack/react-query';
import { useSocket } from '@/components/socket-provider';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { ChatInput } from '@/components/ui/chat/chat-input';
import MessageLoading from '@/components/ui/chat/message-loading';
import { PreviewPlanMessage } from './messages/preview-plan-message';
import { TextMessage } from './messages/text-message';
import { AskCopilotRequest, CopilotSkill, flowStructureUtil, isNil } from '@activepieces/shared';
import { Workflow } from 'lucide-react';
import { PreviewCodeMessage } from './messages/preview-code-message';

export const CopilotSidebar = () => {
  const socket = useSocket();
  const [setLeftSidebar, messages, addMessage, selectedStep, flowId] = useBuilderStateContext((state) => [
    state.setLeftSidebar,
    state.messages,
    state.addMessage,
    isNil(state.selectedStep) ? null : flowStructureUtil.getStep(state.selectedStep, state.flow.version.trigger),
    state.flow.id
  ]);

  const mutation = useMutation({
    mutationFn: (request: Omit<AskCopilotRequest, 'id'>) => copilotApi.ask(socket, request),
    onSuccess: (response) => {
      console.log(response);
      switch (response.type) {
        case 'flow':
          addMessage({
            type: 'flow_plan',
            content: response
          });
          break;
        case 'action':
          addMessage({
            type: 'code_block',
            content: {
              code: response.code,
              inputs: response.inputs,
              operation: response.operation
            }
          });
          break;
        case 'error':
          addMessage({
            type: 'assistant_message',
            content: response.errorMessage ?? 'I don\'t know how to do that.'
          });
          break;
      }
    },
    onError: () => {
      addMessage({
        type: 'assistant_message',
        content: 'Sorry, there was an error generating the workflow.'
      });
    }
  });

  const handleSendMessage = (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const userMessages = messages
      .filter(message => message.type === 'user_message')
      .map(message => message.content);

    if (selectedStep) {
      mutation.mutate({
        flowId,
        skill: CopilotSkill.ACTION,
        prompts: [trimmedContent, ...userMessages],
        selectedStep: selectedStep.name,
      });
    } else {
      mutation.mutate({
        flowId,
        skill: CopilotSkill.PLANNER,
        prompts: [trimmedContent, ...userMessages],
      });
    }

    addMessage({
      type: 'user_message',
      content: trimmedContent
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage((e.target as HTMLTextAreaElement).value);
      (e.target as HTMLTextAreaElement).value = '';
    }
  };

  const renderMessage = (message: MessageContent, index: number) => {
    if (message.type === 'flow_plan') {
      return <PreviewPlanMessage key={index} message={message} />;
    }
    if (message.type === 'code_block') {
      return <PreviewCodeMessage key={index} message={message} />;
    }
    return <TextMessage key={index} content={message} />;
  };

  return (
    <div className="flex h-full flex-col">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        <span>{t('Flow Ninja')}</span>
      </SidebarHeader>

      <ScrollArea className="flex-1">
        <div className="flex flex-col h-full">
          <ChatMessageList className="flex-1">
            {messages.map(renderMessage)}
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-2">
                  <MessageLoading />
                </div>
              </div>
            )}
          </ChatMessageList>
        </div>
      </ScrollArea>

      <div className="p-4">
        {selectedStep && (
          <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            <span>Selected step: {selectedStep.displayName}</span>
          </div>
        )}
        <ChatInput
          placeholder="Type a message..."
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
