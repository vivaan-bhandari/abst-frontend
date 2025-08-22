import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Chip,
  Collapse,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as UserIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const SchedulingChat = ({ selectedFacility }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: "Hi! I'm your scheduling assistant. I can help you with staff information, shift schedules, and AI recommendations. What would you like to know?",
          isBot: true,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedFacility) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/scheduling/chat/`, {
        facility_id: selectedFacility,
        message: inputMessage
      });

      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.response,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble processing your request right now. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const suggestedQuestions = [
    "How many staff do we have?",
    "What are the staff preferences?",
    "How many shifts are scheduled today?",
    "Why did the AI assign Staff 3 to NOC shifts?",
    "Explain the confidence score"
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={toggleChat}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Chat Dialog */}
      <Dialog
        open={isOpen}
        onClose={toggleChat}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: isMinimized ? 'auto' : '70vh',
            minHeight: isMinimized ? 'auto' : '500px'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: 'primary.main',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            <Typography variant="h6">Scheduling Assistant</Typography>
          </Box>
          <Box>
            <IconButton onClick={toggleMinimize} sx={{ color: 'white' }}>
              {isMinimized ? <ChatIcon /> : <CloseIcon />}
            </IconButton>
            <IconButton onClick={toggleChat} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {!isMinimized && (
            <>
              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2, minHeight: '300px' }}>
                <List sx={{ p: 0 }}>
                  {messages.map((message) => (
                    <ListItem key={message.id} sx={{ 
                      flexDirection: 'column', 
                      alignItems: message.isBot ? 'flex-start' : 'flex-end',
                      p: 0, mb: 2
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1,
                        maxWidth: '80%',
                        flexDirection: message.isBot ? 'row' : 'row-reverse'
                      }}>
                        <ListItemAvatar sx={{ minWidth: 'auto' }}>
                          <Avatar sx={{ 
                            bgcolor: message.isBot ? 'primary.main' : 'secondary.main',
                            width: 32, height: 32
                          }}>
                            {message.isBot ? <BotIcon /> : <UserIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <Paper sx={{ 
                          p: 1.5, 
                          backgroundColor: message.isBot ? 'grey.100' : 'primary.light',
                          color: message.isBot ? 'text.primary' : 'white',
                          borderRadius: 2,
                          maxWidth: '100%'
                        }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {message.text}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            mt: 0.5, 
                            opacity: 0.7 
                          }}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </Paper>
                      </Box>
                    </ListItem>
                  ))}
                  {isLoading && (
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', p: 0, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <ListItemAvatar sx={{ minWidth: 'auto' }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            <BotIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <Paper sx={{ p: 1.5, backgroundColor: 'grey.100', borderRadius: 2 }}>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            Thinking...
                          </Typography>
                        </Paper>
                      </Box>
                    </ListItem>
                  )}
                  <div ref={messagesEndRef} />
                </List>
              </Box>

              {/* Suggested Questions */}
              {messages.length === 1 && (
                <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Try asking me:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {suggestedQuestions.map((question, index) => (
                      <Chip
                        key={index}
                        label={question}
                        size="small"
                        onClick={() => setInputMessage(question)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Input Area */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Ask me about scheduling, staff, or AI recommendations..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    size="small"
                  />
                  <IconButton
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    color="primary"
                    sx={{ minWidth: 48 }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchedulingChat;
