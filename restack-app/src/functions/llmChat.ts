import { FunctionFailure, log } from "@restackio/ai/function";
import OpenAI from "openai";
import { openaiClient } from "../utils/client";

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: OpenAI.Chat.ChatCompletionMessage["tool_calls"];
};

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
}: OpenAIChatInput): Promise<Message> => {
  try {
    const openai = openaiClient({});

    const mappedMessages = messages.map((msg): OpenAI.Chat.ChatCompletionMessageParam => {
      if (msg.role === "tool" && msg.tool_call_id) {
        return {
          role: "tool",
          content: msg.content,
          tool_call_id: msg.tool_call_id,
        } as const;
      }
      if (msg.role === "assistant") {
        return {
          role: "assistant",
          content: msg.content,
        } as const;
      }
      if (msg.role === "system") {
        return {
          role: "system",
          content: msg.content,
        } as const;
      }
      return {
        role: "user",
        content: msg.content,
      } as const;
    });

    if (systemContent) {
      mappedMessages.unshift({
        role: "system",
        content: systemContent,
      });
    }

    const chatParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      messages: mappedMessages,
      model,
      temperature,
      max_tokens: maxTokens,
      ...(tools && { tools }),
      stream: false,
    };

    const completion = await openai.chat.completions.create(chatParams);
    const responseMessage = completion.choices[0].message;

    return {
      role: "assistant",
      content: responseMessage.content || "",
      ...(responseMessage.tool_calls && { tool_calls: responseMessage.tool_calls }),
    };
  } catch (error) {
    throw FunctionFailure.nonRetryable(`Error OpenAI chat: ${error}`);
  }
};
