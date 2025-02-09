import { FunctionFailure, log } from "@restackio/ai/function";
import OpenAI from "openai";

import { openaiClient } from "../utils/client";

type BaseMessage = {
  content: string;
};

type SystemMessage = BaseMessage & {
  role: "system";
};

type UserMessage = BaseMessage & {
  role: "user";
};

type AssistantMessage = BaseMessage & {
  role: "assistant";
};

type ToolMessage = BaseMessage & {
  role: "tool";
  tool_call_id: string;
};

export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

export type OpenAIChatInput = {
  systemContent?: string;
  model?: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
};

export const llmChat = async ({
  systemContent = "",
  model = "gpt-4",
  messages,
  temperature = 0.2,
  maxTokens = 300,
  tools,
}: OpenAIChatInput): Promise<OpenAI.Chat.ChatCompletionMessage> => {
  try {
    const openai = openaiClient({});

    const mappedMessages = messages.map((msg) => {
      if (msg.role === "tool") {
        return {
          role: msg.role,
          content: msg.content,
          tool_call_id: msg.tool_call_id,
        } as const;
      }
      return {
        role: msg.role,
        content: msg.content,
      } as const;
    });

    const chatParams: OpenAI.Chat.CompletionCreateParams = {
      messages: [
        ...(systemContent
          ? [{ role: "system" as const, content: systemContent }]
          : []),
        ...mappedMessages,
      ],
      model,
      temperature,
      max_tokens: maxTokens,
      ...(tools && { tools }),
      stream: false,
    };

    log.debug("OpenAI chat completion params", {
      chatParams,
    });

    const completion = await openai.chat.completions.create(chatParams);
    return completion.choices[0].message;
  } catch (error) {
    throw FunctionFailure.nonRetryable(`Error OpenAI chat: ${error}`);
  }
};
