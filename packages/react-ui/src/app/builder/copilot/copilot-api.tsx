import { Socket } from 'socket.io-client';
import {
  AskCopilotResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { nanoid } from 'nanoid';

export const copilotApi = {
  planFlow: async (
    socket: Socket,
    prompts: string[],
  ): Promise<AskCopilotResponse> => {
    const id = nanoid();

    socket.emit(WebsocketServerEvent.ASK_COPILOT, {
      prompts,
      id,
    });

    return new Promise<AskCopilotResponse>((resolve, reject) => {
      socket.on(
        WebsocketClientEvent.ASK_COPILOT_RESPONSE,
        (response: AskCopilotResponse) => {
          if (response.id === id) {
            resolve(response);
          }
        },
      );

      socket.on('error', (error: unknown) => {
        reject(error);
      });
    });
  },
};