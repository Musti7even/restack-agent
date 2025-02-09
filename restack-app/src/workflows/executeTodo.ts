import { log, sleep, step } from "@restackio/ai/workflow";
import * as functions from "../functions";

type Input = {
  todoTitle: string;
  todoId: string;
  messages: Message[];
  systemContent?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

type Output = {
  todoId: string;
  todoTitle: string;
  details: string;
  status: string;
};

export async function executeTodoWorkflow({
  todoTitle,
  todoId,
  messages,
  systemContent,
  model = "gpt-4",
  temperature = 0.2,
  maxTokens = 300,
}: Input): Promise<Output> {
  if (!todoTitle || !todoId) {
    throw new Error("todoTitle and todoId are required");
  }

  const chatResponse = await step<typeof functions>({}).llmChat({
    systemContent,
    messages,
    model,
    temperature,
    maxTokens,
  });

  await sleep(2000);

  const result = await step<typeof functions>({}).getResult({
    todoTitle,
    todoId,
  });

  const details = chatResponse?.content || "No details available";

  const todoDetails: Output = {
    todoId,
    todoTitle,
    details,
    status: result.status,
  };

  log.info("Todo Details", { todoDetails });

  return todoDetails;
}
