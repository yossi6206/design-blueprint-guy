import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Profile {
  id: string;
  user_handle: string;
  user_name: string;
  avatar_url: string | null;
}

interface MentionAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

export const MentionAutocomplete = ({ textareaRef, value, onChange }: MentionAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionTrigger, setMentionTrigger] = useState<{ start: number; query: string } | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = () => {
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      
      // Find the last @ before cursor
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Check if there's a space after the @, if so, don't show suggestions
        if (textAfterAt.includes(' ')) {
          setShowSuggestions(false);
          setMentionTrigger(null);
          return;
        }
        
        setMentionTrigger({ start: lastAtIndex, query: textAfterAt });
        
        // Calculate position for dropdown
        const rect = textarea.getBoundingClientRect();
        const textareaStyle = window.getComputedStyle(textarea);
        const lineHeight = parseInt(textareaStyle.lineHeight);
        
        setPosition({
          top: rect.top + lineHeight + 5,
          left: rect.left + 10,
        });
      } else {
        setShowSuggestions(false);
        setMentionTrigger(null);
      }
    };

    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('click', handleInput);
    
    return () => {
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('click', handleInput);
    };
  }, [value, textareaRef]);

  useEffect(() => {
    if (!mentionTrigger) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      const query = mentionTrigger.query.toLowerCase();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_handle, user_name, avatar_url")
        .or(`user_handle.ilike.${query}%,user_name.ilike.${query}%`)
        .limit(5);

      if (!error && data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [mentionTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          selectMention(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedIndex]);

  const selectMention = (profile: Profile) => {
    if (!mentionTrigger) return;

    const beforeMention = value.substring(0, mentionTrigger.start);
    const afterMention = value.substring(mentionTrigger.start + mentionTrigger.query.length + 1);
    const newValue = `${beforeMention}@${profile.user_handle} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionTrigger(null);
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = beforeMention.length + profile.user_handle.length + 2;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  if (!showSuggestions || suggestions.length === 0) return null;

  return (
    <div
      ref={suggestionsRef}
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg w-64"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <ScrollArea className="max-h-60">
        <div className="p-1">
          {suggestions.map((profile, index) => (
            <button
              key={profile.id}
              type="button"
              className={`w-full flex items-center gap-2 p-2 rounded-md text-right transition-colors ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => selectMention(profile)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_handle}`}
                />
                <AvatarFallback>{profile.user_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-right overflow-hidden">
                <div className="font-semibold text-sm truncate">{profile.user_name}</div>
                <div className="text-xs text-muted-foreground truncate">@{profile.user_handle}</div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
