import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useInterrupt } from '@/components/canvas/live2d';
import { useChatHistory } from '@/context/chat-history-context';
import { useVAD } from '@/context/vad-context';
import { toaster } from '@/components/ui/toaster';
import { useMediaCapture, ImageData } from '@/hooks/utils/use-media-capture';

export function useTextInput() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [attachedImages, setAttachedImages] = useState<ImageData[]>([]);
  const wsContext = useWebSocket();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();
  const { appendHumanMessage } = useChatHistory();
  const { stopMic, autoStopMic } = useVAD();
  const { captureAllMedia } = useMediaCapture();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const readFileAsDataUrl = useCallback((file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  }), []);

  const handleAttachFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageData[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toaster.create({
          title: t('error.unsupportedFileType'),
          type: 'error',
          duration: 2000,
        });
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newImages.push({
          source: 'upload',
          data: dataUrl,
          mime_type: file.type || 'image/*',
        });
      } catch (error) {
        console.error('Failed to read attachment:', error);
        toaster.create({
          title: t('error.failedReadFile', { filename: file.name }),
          type: 'error',
          duration: 2000,
        });
      }
    }

    if (newImages.length > 0) {
      setAttachedImages((prev) => [...prev, ...newImages]);
    }
  }, [readFileAsDataUrl, t]);

  const handleSend = async () => {
    if (!wsContext) return;
    if (!inputText.trim() && attachedImages.length === 0) return;
    if (aiState === 'thinking-speaking') {
      interrupt();
    }

    const images = [...(await captureAllMedia()), ...attachedImages];

    if (inputText.trim()) {
      appendHumanMessage(inputText.trim());
    }
    wsContext.sendMessage({
      type: 'text-input',
      text: inputText.trim(),
      images,
    });

    if (autoStopMic) stopMic();
    setInputText('');
    setAttachedImages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  return {
    inputText,
    setInputText: handleInputChange,
    handleSend,
    handleAttachFiles,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    attachedImages,
  };
}
