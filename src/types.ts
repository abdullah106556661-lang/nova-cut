export type CategoryId =
  | "all"
  | "writing"
  | "code"
  | "visual"
  | "translation"
  | "analysis"
  | "business"
  | "chat"
  | "custom";

export interface ToolField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image";
  placeholder?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface AITool {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  iconName: string;
  badge?: string;
  systemInstruction: string;
  fields: ToolField[];
  samplePrompts?: string[];
  outputType?: "markdown" | "code" | "text" | "image";
  supportsVision?: boolean;
  supportsSearch?: boolean;
}

export interface ToolOutputHistory {
  id: string;
  toolId: string;
  toolName: string;
  category: CategoryId;
  inputValues: Record<string, string>;
  output: string;
  timestamp: string;
  groundingChunks?: { web?: { uri?: string; title?: string } }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  icon: string;
  systemInstruction: string;
}

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  iconName: string;
  systemInstruction: string;
  promptTemplate: string; // e.g. "Write a {type} about {topic} for {audience}"
  fields: ToolField[];
  createdAt: string;
}
