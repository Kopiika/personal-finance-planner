import { useState } from "react";
import {
  Box,
  IconButton,
  CircularProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { parseVoiceText } from "../services/voiceService";

const VoiceInputButton = ({ onResult }) => {
  const [isParsing, setIsParsing] = useState(false);

  const handleTranscript = async (text) => {
    setIsParsing(true);
    try {
      const result = await parseVoiceText(text);
      onResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsParsing(false);
    }
  };

  const { isListening, transcript, error, startListening } =
    useVoiceInput(handleTranscript);

  return (
    <Box>
      <Tooltip title="Add by voice">
        <span>
          <IconButton
            onClick={startListening}
            disabled={isListening || isParsing}
            color={isListening ? "error" : "primary"}
          >
            {isParsing ? <CircularProgress size={24} /> : <MicIcon />}
          </IconButton>
        </span>
      </Tooltip>
      {transcript && (
        <Typography variant="caption" color="text.secondary">
          "{transcript}"
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default VoiceInputButton;
