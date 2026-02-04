/* eslint-disable react/require-default-props */
import {
  Box, Textarea, IconButton, HStack, Image,
} from '@chakra-ui/react';
import { BsMicFill, BsMicMuteFill, BsPaperclip } from 'react-icons/bs';
import { IoHandRightSharp } from 'react-icons/io5';
import { FiChevronDown } from 'react-icons/fi';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { InputGroup } from '@/components/ui/input-group';
import { footerStyles } from './footer-styles';
import AIStateIndicator from './ai-state-indicator';
import { useFooter } from '@/hooks/footer/use-footer';

// Type definitions
interface FooterProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface ToggleButtonProps {
  isCollapsed: boolean
  onToggle?: () => void
}

interface ActionButtonsProps {
  micOn: boolean
  onMicToggle: () => void
  onInterrupt: () => void
}

interface MessageInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onCompositionStart: () => void
  onCompositionEnd: () => void
  onAttachFiles: (files: FileList | null) => void
  attachedCount: number
}

// Reusable components
const ToggleButton = memo(({ isCollapsed, onToggle }: ToggleButtonProps) => (
  <Box
    {...footerStyles.footer.toggleButton}
    onClick={onToggle}
    color="whiteAlpha.500"
    style={{
      transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
    }}
  >
    <FiChevronDown />
  </Box>
));

ToggleButton.displayName = 'ToggleButton';

const ActionButtons = memo(({ micOn, onMicToggle, onInterrupt }: ActionButtonsProps) => (
  <HStack gap={2}>
    <IconButton
      bg={micOn ? 'green.500' : 'red.500'}
      {...footerStyles.footer.actionButton}
      onClick={onMicToggle}
    >
      {micOn ? <BsMicFill /> : <BsMicMuteFill />}
    </IconButton>
    <IconButton
      aria-label="Raise hand"
      bg="yellow.500"
      {...footerStyles.footer.actionButton}
      onClick={onInterrupt}
    >
      <IoHandRightSharp size="24" />
    </IconButton>
  </HStack>
));

ActionButtons.displayName = 'ActionButtons';

const MessageInput = memo(({
  value,
  onChange,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  onAttachFiles,
  attachedCount,
}: MessageInputProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Box flex={1} minW="0" display="flex" flexDirection="column" gap="2">
      <InputGroup>
        <Box position="relative" width="100%">
          <IconButton
            aria-label="Attach file"
            variant="ghost"
            {...footerStyles.footer.attachButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <BsPaperclip size="24" />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(event) => {
              onAttachFiles(event.target.files);
              event.target.value = '';
            }}
            aria-label={t('footer.attachFile')}
          />
          <Textarea
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            placeholder={t('footer.typeYourMessage')}
            {...footerStyles.footer.input}
          />
          {attachedCount > 0 && (
            <Box
              position="absolute"
              top="2"
              right="2"
              fontSize="xs"
              color="whiteAlpha.700"
            >
              {t('footer.attachmentsCount', { count: attachedCount })}
            </Box>
          )}
        </Box>
      </InputGroup>
    </Box>
  );
});

MessageInput.displayName = 'MessageInput';

// Main component
function Footer({ isCollapsed = false, onToggle }: FooterProps): JSX.Element {
  const { t } = useTranslation();
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleAttachFiles,
    attachedImages,
    handleInterrupt,
    handleMicToggle,
    micOn,
  } = useFooter();

  return (
    <Box {...footerStyles.footer.container(isCollapsed, attachedImages.length > 0)}>
      <ToggleButton isCollapsed={isCollapsed} onToggle={onToggle} />

      <Box pt="0" px="4">
        {attachedImages.length > 0 && (
          <Box
            width="100%"
            minW="0"
            bg="gray.700"
            borderRadius="12px"
            px="3"
            py="2"
            mb="3"
          >
            <HStack spacing="2" flexWrap="wrap">
              {attachedImages.map((image, index) => (
                <Box
                  key={`${image.data}-${index}`}
                  borderRadius="md"
                  overflow="hidden"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                >
                  <Image
                    src={image.data}
                    alt={t('footer.attachFile')}
                    boxSize="64px"
                    objectFit="cover"
                  />
                </Box>
              ))}
            </HStack>
          </Box>
        )}
        <HStack width="100%" gap={4} align="flex-start">
          <Box flexShrink={0}>
            <Box mb="1.5">
              <AIStateIndicator />
            </Box>
            <ActionButtons
              micOn={micOn}
              onMicToggle={handleMicToggle}
              onInterrupt={handleInterrupt}
            />
          </Box>

          <MessageInput
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onAttachFiles={handleAttachFiles}
            attachedCount={attachedImages.length}
          />
        </HStack>
      </Box>
    </Box>
  );
}

export default Footer;
