import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatView from '../../components/chat/ChatView';
import ChatEmptyState from '../../components/chat/ChatEmptyState';
import NewConversationDialog from '../../components/chat/dialogs/NewConversationDialog';
import ForwardMessageDialog from '../../components/chat/dialogs/ForwardMessageDialog';
import CreateTaskDialog from '../../components/chat/dialogs/CreateTaskDialog';
import ConversationSettingsPanel from '../../components/chat/panels/ConversationSettingsPanel';
import PinnedMessagesPanel from '../../components/chat/panels/PinnedMessagesPanel';
import SearchPanel from '../../components/chat/panels/SearchPanel';
import { useChat } from '../../context/ChatContext';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setActiveConversation } = useChat();

  // Dialogs & panels
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [createTaskMsg, setCreateTaskMsg] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Mobile sidebar toggle
  const showSidebar = !isMobile || !conversationId;
  const showChat = !isMobile || !!conversationId;

  // Sync active conversation with URL
  useEffect(() => {
    setActiveConversation(conversationId || null);
  }, [conversationId, setActiveConversation]);

  const handleSelectConversation = useCallback(
    (id) => {
      navigate(`/chat/${id}`);
    },
    [navigate]
  );

  const handleBack = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  const handleNewConversationCreated = useCallback(
    (conv) => {
      if (conv?._id) {
        navigate(`/chat/${conv._id}`);
      }
      setNewConvOpen(false);
    },
    [navigate]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        mx: { xs: -2, sm: -3 },
        mt: { xs: -2, sm: -3 },
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      {showSidebar && (
        <ChatSidebar
          activeConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => setNewConvOpen(true)}
        />
      )}

      {/* Chat view or empty state */}
      {showChat && (
        conversationId ? (
          <ChatView
            conversationId={conversationId}
            onBack={handleBack}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenPinned={() => setPinnedOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onForwardMessage={(msg) => setForwardMsg(msg)}
            onCreateTaskFromMessage={(msg) => setCreateTaskMsg(msg)}
          />
        ) : (
          !isMobile && <ChatEmptyState />
        )
      )}

      {/* Dialogs */}
      <NewConversationDialog
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onCreated={handleNewConversationCreated}
      />

      <ForwardMessageDialog
        open={Boolean(forwardMsg)}
        message={forwardMsg}
        onClose={() => setForwardMsg(null)}
      />

      <CreateTaskDialog
        open={Boolean(createTaskMsg)}
        message={createTaskMsg}
        onClose={() => setCreateTaskMsg(null)}
      />

      {/* Panels */}
      <ConversationSettingsPanel
        open={settingsOpen}
        conversationId={conversationId}
        onClose={() => setSettingsOpen(false)}
      />

      <PinnedMessagesPanel
        open={pinnedOpen}
        conversationId={conversationId}
        onClose={() => setPinnedOpen(false)}
      />

      <SearchPanel
        open={searchOpen}
        conversationId={conversationId}
        onClose={() => setSearchOpen(false)}
        onNavigateToMessage={(convId) => {
          if (convId !== conversationId) navigate(`/chat/${convId}`);
          setSearchOpen(false);
        }}
      />
    </Box>
  );
};

export default ChatPage;
