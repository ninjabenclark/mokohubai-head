import React, { useState, useEffect, useRef, useCallback } from 'react'; 
import { 
  Box, TextField, Button, Typography, Paper, Avatar, CircularProgress, 
  IconButton, Fade, Snackbar, Alert, createTheme, ThemeProvider, CssBaseline 
} from '@mui/material'; 
import SendIcon from '@mui/icons-material/Send'; 
import MicIcon from '@mui/icons-material/Mic'; 
import StopIcon from '@mui/icons-material/Stop'; 
import { styled } from '@mui/system'; 

// --- Theme Definition ---
const mokohubTheme = createTheme({
  typography: {
    fontFamily: ['Inter', 'Roboto', 'sans-serif'].join(','),
    h5: { fontWeight: 600 },
    body2: { lineHeight: 1.5 },
  },
  palette: {
    primary: { main: '#42a5f5', light: '#64b5f6', dark: '#1976d2', contrastText: '#ffffff' },
    secondary: { main: '#ab47bc', light: '#ce93d8', dark: '#7b1fa2', contrastText: '#ffffff' },
    background: { default: '#f0f2f5', paper: '#ffffff' },
    text: { primary: '#333333', secondary: '#666666', disabled: '#999999' },
    error: { main: '#ef5350', contrastText: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } } },
    MuiPaper: { styleOverrides: { root: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' } } },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#e0e0e0' },
            '&:hover fieldset': { borderColor: '#bdbdbd' },
            '&.Mui-focused fieldset': { borderColor: '#42a5f5' },
          },
        },
      },
    },
  },
});

const BOT_NAME = "MokoHub AI";
const USER_NAME = "You";
const SIMULATED_BOT_RESPONSE_DELAY = 750;
const MAX_INPUT_ROWS = 8;

const RootContainer = styled(Box)(({ theme }) => ({
  display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.palette.background.default,
  fontFamily: theme.typography.fontFamily, width: '100vw', maxWidth: '100%', overflowX: 'hidden',
}));

const Header = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2), borderRadius: 0, backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText, textAlign: 'center',
}));

const ChatArea = styled(Box)(({ theme }) => ({
  flex: 1, overflowY: 'auto', padding: theme.spacing(2), display: 'flex', flexDirection: 'column',
  gap: theme.spacing(1),
}));

const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2), borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: theme.spacing(1),
}));

const MokoHubHead = () => {
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hi, I’m MokoHub. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setAlertOpen(true);

      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSend(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (textOverride) => {
    const userText = textOverride || inputText.trim();
    if (!userText) return;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'assistant', text: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => recognitionRef.current?.start();

  return (
    <ThemeProvider theme={mokohubTheme}>
      <CssBaseline />
      <RootContainer>
        <Header>
          <Typography variant="h5">{BOT_NAME}</Typography>
        </Header>
        <ChatArea>
          {messages.map((msg, idx) => (
            <Paper key={idx} elevation={1} sx={{ p: 1.5, alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'user' ? 'primary.main' : 'background.paper', color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary', maxWidth: '80%' }}>
              <Typography variant="body2">{msg.text}</Typography>
            </Paper>
          ))}
          <div ref={messagesEndRef} />
        </ChatArea>
        <InputArea>
          <TextField
            fullWidth
            placeholder="Type your message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend} disabled={loading}><SendIcon /></IconButton>
          <IconButton color={listening ? 'error' : 'secondary'} onClick={startListening}><MicIcon /></IconButton>
        </InputArea>
        <Snackbar open={alertOpen} autoHideDuration={4000} onClose={() => setAlertOpen(false)}>
          <Alert severity="error">Speech recognition not available.</Alert>
        </Snackbar>
      </RootContainer>
    </ThemeProvider>
  );
};

export default MokoHubHead;
