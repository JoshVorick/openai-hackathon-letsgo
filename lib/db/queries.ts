import "server-only";

import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import {
  type Chat,
  type DBMessage,
  type Document,
  type Suggestion,
  type User,
  type Vote,
} from "./schema";
import { generateHashedPassword } from "./utils";
import { supabase } from "./supabase";

const CHAT_TABLE = "Chat";
const MESSAGE_TABLE = "Message_v2";
const VOTE_TABLE = "Vote_v2";
const DOCUMENT_TABLE = "Document";
const SUGGESTION_TABLE = "Suggestion";
const STREAM_TABLE = "Stream";
const USER_TABLE = "User";

function toChat(row: any): Chat {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
  } as Chat;
}

function toChats(rows: any[] | null | undefined): Chat[] {
  if (!rows) {
    return [];
  }

  return rows.map((row) => toChat(row));
}

function toMessage(row: any): DBMessage {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
  } as DBMessage;
}

function toMessages(rows: any[] | null | undefined): DBMessage[] {
  if (!rows) {
    return [];
  }

  return rows.map((row) => toMessage(row));
}

function toDocument(row: any): Document {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
  } as Document;
}

function toDocuments(rows: any[] | null | undefined): Document[] {
  if (!rows) {
    return [];
  }

  return rows.map((row) => toDocument(row));
}

function toSuggestion(row: any) {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    documentCreatedAt: new Date(row.documentCreatedAt),
  } as Suggestion;
}

function toSuggestions(rows: any[] | null | undefined): Suggestion[] {
  if (!rows) {
    return [];
  }

  return rows.map((row) => toSuggestion(row));
}

export async function getUser(email: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from(USER_TABLE)
      .select()
      .eq("email", email);

    if (error) {
      throw error;
    }

    return (data as User[]) ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    const { error, data } = await supabase
      .from(USER_TABLE)
      .insert({ email, password: hashedPassword })
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    const { data, error } = await supabase
      .from(USER_TABLE)
      .insert({ email, password })
      .select("id, email");

    if (error) {
      throw error;
    }

    return (data ?? []) as Pick<User, "id" | "email">[];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    const { error, data } = await supabase
      .from(CHAT_TABLE)
      .insert({
        id,
        createdAt: new Date().toISOString(),
        userId,
        title,
        visibility,
      })
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const { error: voteError } = await supabase
      .from(VOTE_TABLE)
      .delete()
      .eq("chatId", id);

    if (voteError) {
      throw voteError;
    }

    const { error: messageError } = await supabase
      .from(MESSAGE_TABLE)
      .delete()
      .eq("chatId", id);

    if (messageError) {
      throw messageError;
    }

    const { error: streamError } = await supabase
      .from(STREAM_TABLE)
      .delete()
      .eq("chatId", id);

    if (streamError) {
      throw streamError;
    }

    const { data, error } = await supabase
      .from(CHAT_TABLE)
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    const [chatsDeleted] = toChats(data);
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    let query = supabase
      .from(CHAT_TABLE)
      .select()
      .eq("userId", id);

    if (startingAfter) {
      const selectedChat = await getChatById({ id: startingAfter });

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      query = query.gt("createdAt", selectedChat.createdAt.toISOString());
    } else if (endingBefore) {
      const selectedChat = await getChatById({ id: endingBefore });

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      query = query.lt("createdAt", selectedChat.createdAt.toISOString());
    }

    const { data, error } = await query
      .order("createdAt", { ascending: false })
      .limit(extendedLimit);

    if (error) {
      throw error;
    }

    const filteredChats = toChats(data);
    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(CHAT_TABLE)
      .select()
      .eq("id", id)
      .limit(1);

    if (error) {
      throw error;
    }

    const [selectedChat] = toChats(data);
    return selectedChat ?? null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    const payload = messages.map((message) => ({
      ...message,
      createdAt: message.createdAt instanceof Date
        ? message.createdAt.toISOString()
        : new Date(message.createdAt).toISOString(),
    }));

    const { error, data } = await supabase
      .from(MESSAGE_TABLE)
      .insert(payload)
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(MESSAGE_TABLE)
      .select()
      .eq("chatId", id)
      .order("createdAt", { ascending: true });

    if (error) {
      throw error;
    }

    return toMessages(data);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const { data, error } = await supabase
      .from(VOTE_TABLE)
      .upsert(
        {
          chatId,
          messageId,
          isUpvoted: type === "up",
        },
        { onConflict: "chatId,messageId" }
      )
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(VOTE_TABLE)
      .select()
      .eq("chatId", id);

    if (error) {
      throw error;
    }

    return (data as Vote[]) ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .insert({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return toDocuments(data);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .select()
      .eq("id", id)
      .order("createdAt", { ascending: true });

    if (error) {
      throw error;
    }

    return toDocuments(data);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .select()
      .eq("id", id)
      .order("createdAt", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const [document] = toDocuments(data);
    return document ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const timestampIso = timestamp.toISOString();

    const { error: suggestionError } = await supabase
      .from(SUGGESTION_TABLE)
      .delete()
      .eq("documentId", id)
      .gt("documentCreatedAt", timestampIso);

    if (suggestionError) {
      throw suggestionError;
    }

    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .delete()
      .eq("id", id)
      .gt("createdAt", timestampIso)
      .select();

    if (error) {
      throw error;
    }

    return toDocuments(data);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    const payload = suggestions.map((suggestion) => ({
      ...suggestion,
      createdAt: suggestion.createdAt instanceof Date
        ? suggestion.createdAt.toISOString()
        : new Date(suggestion.createdAt).toISOString(),
      documentCreatedAt:
        suggestion.documentCreatedAt instanceof Date
          ? suggestion.documentCreatedAt.toISOString()
          : new Date(suggestion.documentCreatedAt).toISOString(),
    }));

    const { error, data } = await supabase
      .from(SUGGESTION_TABLE)
      .insert(payload)
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const { data, error } = await supabase
      .from(SUGGESTION_TABLE)
      .select()
      .eq("documentId", documentId);

    if (error) {
      throw error;
    }

    return toSuggestions(data);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(MESSAGE_TABLE)
      .select()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return toMessages(data);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const timestampIso = timestamp.toISOString();

    const { data: messagesToDelete, error: selectError } = await supabase
      .from(MESSAGE_TABLE)
      .select("id")
      .eq("chatId", chatId)
      .gte("createdAt", timestampIso);

    if (selectError) {
      throw selectError;
    }

    const messageIds = (messagesToDelete ?? []).map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      const { error: voteError } = await supabase
        .from(VOTE_TABLE)
        .delete()
        .eq("chatId", chatId)
        .in("messageId", messageIds);

      if (voteError) {
        throw voteError;
      }

      const { error } = await supabase
        .from(MESSAGE_TABLE)
        .delete()
        .eq("chatId", chatId)
        .in("id", messageIds);

      if (error) {
        throw error;
      }
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    const { error, data } = await supabase
      .from(CHAT_TABLE)
      .update({ visibility })
      .eq("id", chatId)
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    const { error } = await supabase
      .from(CHAT_TABLE)
      .update({ lastContext: context })
      .eq("id", chatId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    ).toISOString();

    const { count, error } = await supabase
      .from(MESSAGE_TABLE)
      .select("id, Chat!inner(userId)", { count: "exact", head: true })
      .eq("role", "user")
      .eq("Chat.userId", id)
      .gte("createdAt", twentyFourHoursAgo);

    if (error) {
      throw error;
    }

    return count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    const { error } = await supabase
      .from(STREAM_TABLE)
      .insert({ id: streamId, chatId, createdAt: new Date().toISOString() });

    if (error) {
      throw error;
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const { data, error } = await supabase
      .from(STREAM_TABLE)
      .select("id")
      .eq("chatId", chatId)
      .order("createdAt", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(({ id }) => id as string);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
