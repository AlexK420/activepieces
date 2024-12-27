import { t } from "i18next";
import { LeftSideBarType, useBuilderStateContext } from "../builder-hooks";
import { SidebarHeader } from "../sidebar-header";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon} from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { WelcomeMessage } from "./welcome-message";
import { UserMessage } from "./user-message";
import { FeedbackMessage } from "./feedback-message";
import { LoadingMessage } from "./loading-message";
import { PiecesMessage } from "./pieces-message";

type CopilotMessage = {
  type: 'welcome' | 'user' | 'feedback' | 'loading' | 'pieces';
  message?: string;
  pieces?: string[];
}

export const CopilotSidebar = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { type: 'welcome', message: "Hi! I'm Lotfi, your AI assistant. How can I help you today?" }
  ]);
  const [setLeftSidebar] = useBuilderStateContext(
    (state) => [state.setLeftSidebar],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const newMessages: CopilotMessage[] = [...messages, { type: 'user', message: input }];
      setMessages(newMessages);
      setInput(""); 
      setMessages([...newMessages, { type: 'loading', message: "Discovering relevant pieces" }]);
      
      // Add timeout to simulate API call
      setTimeout(() => {
        setMessages([
          ...newMessages,
          { 
            type: 'pieces', 
            pieces: ['@activepieces/piece-google-sheets', '@activepieces/piece-slack']
          }
        ]);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        {t('Ask Lotfi')}
      </SidebarHeader>
      <ChatMessageList className="flex-grow space-y-6">
        {messages.map((msg, index) => {
          switch (msg.type) {
            case 'welcome':
              return <WelcomeMessage key={index} />;
            case 'user':
              return <UserMessage key={index} message={msg.message} />;
            case 'feedback':
              return <FeedbackMessage key={index} />;
            case 'loading':
              return <LoadingMessage key={index} message={msg.message} />;
            case 'pieces':
              return <PiecesMessage key={index} pieces={msg.pieces || []} />;
            default:
              return null;
          }
        })}
      </ChatMessageList>
      <div className="p-4">
        <form onSubmit={onSubmit}>
          <ChatInput
            autoFocus
            minRows={1}
            maxRows={10}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.stopPropagation()
              e.preventDefault()
            }}
            placeholder="Message Lotfi"
            className="rounded-lg"
            button={
              <Button
                disabled={!input}
                type="submit"
                size="icon"
                className="rounded-full min-w-6 min-h-6 h-6 w-6 text-black bg-black"
              >
                <ArrowUpIcon className="w-3 h-3 " />
              </Button>
            }
          />
        </form>
      </div>
    </div>
  );
};

CopilotSidebar.displayName = 'ChatSidebar';
