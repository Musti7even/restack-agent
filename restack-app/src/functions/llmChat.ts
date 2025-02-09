import { FunctionFailure, log } from "@restackio/ai/function";
import OpenAI from "openai";
import { openaiClient } from "../utils/client";

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
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

    const chatParams: OpenAI.Chat.CompletionCreateParams = {
      messages: [
        ...(systemContent ? [{ role: "system", content: systemContent }] : []),
        ...messages.map(({ role, content, tool_call_id }) => ({
          role,
          content,
          ...(tool_call_id && { tool_call_id }),
        })),
      ],
      model,
      temperature,
      max_tokens: maxTokens,
      ...(tools && { tools }),
      stream: false,
    };

    const completion = await openai.chat.completions.create(chatParams) as OpenAI.Chat.ChatCompletion;
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
