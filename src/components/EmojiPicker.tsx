import { Smile } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <Smile className="h-5 w-5 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-0">
        <Picker 
          data={data} 
          onEmojiSelect={(emoji: any) => onEmojiSelect(emoji.native)}
          theme="auto"
          locale="he"
        />
      </PopoverContent>
    </Popover>
  );
};