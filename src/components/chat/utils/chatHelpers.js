/**
 * Get display name for a conversation based on its type.
 */
export function getConversationDisplayName(conversation, currentUserId) {
  if (!conversation) return 'Unknown';

  if (conversation.type === 'direct') {
    const other = conversation.participants?.find(
      (p) => p.user?._id !== currentUserId && p.isActive !== false
    );
    if (other?.user) {
      return `${other.user.firstName} ${other.user.lastName}`;
    }
    return 'Unknown User';
  }

  if (conversation.type === 'entity' && conversation.entity?.displayLabel) {
    return conversation.entity.displayLabel;
  }

  return conversation.name || 'Unnamed Group';
}

/**
 * Get the other participant's avatar info for direct conversations.
 */
export function getOtherParticipant(conversation, currentUserId) {
  if (conversation?.type !== 'direct') return null;
  return conversation.participants?.find(
    (p) => p.user?._id !== currentUserId && p.isActive !== false
  ) || null;
}

/**
 * Get a human-readable date label for message separators.
 */
export function getDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Insert date separators between messages with different dates.
 * Messages should be in chronological order (oldest first).
 */
export function messagesWithDateSeparators(messages) {
  const result = [];
  let lastDate = null;

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      result.push({ _type: 'date_separator', _id: `sep_${msgDate}`, label: getDateLabel(msg.createdAt) });
      lastDate = msgDate;
    }
    result.push(msg);
  });

  return result;
}

/**
 * Determine if sender info should be shown for a message.
 * Hides sender for consecutive messages from the same sender within 5 minutes.
 */
export function shouldShowSenderInfo(message, previousMessage) {
  if (!previousMessage) return true;
  if (message.type === 'system') return false;
  if (previousMessage.type === 'system') return true;
  if (message.sender?._id !== previousMessage.sender?._id) return true;

  const timeDiff = new Date(message.createdAt) - new Date(previousMessage.createdAt);
  return timeDiff > 5 * 60 * 1000;
}

/**
 * Group reactions by emoji with count and current user highlight.
 */
export function groupReactions(reactions, currentUserId) {
  if (!reactions?.length) return [];

  const grouped = {};
  reactions.forEach((r) => {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasReacted: false };
    }
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user);
    if (r.user?._id === currentUserId) {
      grouped[r.emoji].hasReacted = true;
    }
  });

  return Object.values(grouped);
}

/**
 * Get typing indicator text for a conversation.
 */
export function getTypingText(typingMap) {
  if (!typingMap) return null;
  const names = Object.values(typingMap);
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} is typing...`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;
}

/**
 * Parse @mentions from message text against conversation participants.
 * Returns array of user IDs that were mentioned.
 */
export function parseMentions(text, participants) {
  if (!text || !participants?.length) return [];
  const mentionIds = [];
  participants.forEach((p) => {
    if (!p.user) return;
    const fullName = `${p.user.firstName} ${p.user.lastName}`;
    if (text.includes(`@${fullName}`)) {
      mentionIds.push(p.user._id);
    }
  });
  return mentionIds;
}

/**
 * Get system message display text.
 */
export function getSystemMessageText(message) {
  const { systemEvent, systemData } = message.content || {};
  switch (systemEvent) {
    case 'conversation_created':
      return `${systemData?.createdByName || 'Someone'} created this group`;
    case 'participant_added':
      return `${systemData?.addedByName || 'Someone'} added ${systemData?.userIds?.length || 1} participant(s)`;
    case 'participant_removed':
      if (systemData?.removedSelf) return `${systemData?.removedByName || 'Someone'} left`;
      return `${systemData?.removedByName || 'Someone'} removed a participant`;
    case 'name_changed':
      return `${systemData?.changedByName || 'Someone'} changed the group name to "${systemData?.newName || ''}"`;
    default:
      return message.content?.text || 'System message';
  }
}

/**
 * Build a lastMessage preview object from a Message for updating conversation list.
 */
export function buildLastMessagePreview(message) {
  let text = message.content?.text?.substring(0, 100);
  if (!text) {
    if (message.attachments?.length) text = 'Sent an attachment';
    else if (message.entityReference) text = `Shared: ${message.entityReference.displayLabel}`;
    else text = '';
  }

  return {
    text,
    sender: message.sender,
    senderName: message.sender
      ? `${message.sender.firstName} ${message.sender.lastName}`
      : '',
    timestamp: message.createdAt,
    messageType: message.type,
  };
}

/**
 * Map alert severity from backend to MUI severity.
 */
export const ENTITY_TYPE_ICONS = {
  Lead: 'PersonSearch',
  Sale: 'Receipt',
  Project: 'Business',
  Invoice: 'Description',
  ConstructionMilestone: 'Engineering',
  PaymentTransaction: 'Payment',
  Task: 'TaskAlt',
};

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
