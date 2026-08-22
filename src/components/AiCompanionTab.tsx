import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ShieldAlert, 
  Heart, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { calculatePregnancyProgress } from '../utils/pregnancy';
import { getTranslations } from '../utils/i18n';

interface AiCompanionTabProps {
  user: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const AiCompanionTab: React.FC<AiCompanionTabProps> = ({
  user,
  messages,
  onSendMessage,
}) => {
  const t = getTranslations(user.language);
  const progress = calculatePregnancyProgress(user.dueDate);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    `What are common physical symptoms at Week ${progress.gestationalWeek}?`,
    'What are delicious, non-constipating iron-rich foods?',
    'How can my partner support me when I feel overwhelmed?',
    'What is the difference between Braxton Hicks and true labor?',
    'Is mild swelling in feet normal in the evening?',
    'Gentle sleeping positions for third trimester comfort',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const handleQuickQuestion = (q: string) => {
    onSendMessage(q);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FFF5F2] via-[#FFFDFB] to-[#FCEFEA] p-6 sm:p-8 rounded-3xl border border-[#EAD7D2] shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
          <Sparkles className="w-4 h-4" />
          <span>Empathetic Maternal AI Companion</span>
        </div>
        <h1 className="font-serif text-3xl text-[#2E2020] font-bold">
          Janani Care+ Assistant
        </h1>
        <p className="text-sm text-[#735E61] max-w-2xl leading-relaxed">
          Ask questions regarding your current gestational week, comforting stretches, nutritious snacks, and emotional wellness.
        </p>

        {/* Disclaimer Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-white/90 border border-[#EADBCE] text-[11px] text-[#634E51] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#9F4F52] flex-shrink-0 mt-0.5" />
          <div>
            <strong>Educational & Wellness Guidance Only:</strong> Janani Care+ provides gentle maternal support and does not replace medical advice, clinical diagnosis, or hospital emergency triage. Always consult your obstetrician for clinical symptoms.
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#6E5558] flex items-center gap-1.5 px-1">
          <Lightbulb className="w-3.5 h-3.5 text-[#9F4F52]" />
          <span>Suggested topics for Week {progress.gestationalWeek}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q)}
              className="text-left text-xs px-3.5 py-2 rounded-2xl bg-white hover:bg-[#F9EEEA] border border-[#E8D6D1] text-[#4F3C3F] transition-all cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-[#EAD7D2] p-6 shadow-2xs space-y-4 min-h-[380px] max-h-[550px] overflow-y-auto">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9F4F52] to-[#D97D81] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed space-y-1 ${
                  isUser
                    ? 'bg-[#9F4F52] text-white rounded-br-xs'
                    : 'bg-[#FAF6F3] text-[#382628] border border-[#EADBCE] rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line font-normal">
                  {msg.text}
                </div>
                <div className={`text-[10px] text-right ${isUser ? 'text-[#FAD8DA]' : 'text-[#8A7174]'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#EAD7D2] text-[#593E41] flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask Janani Care+ anything about your pregnancy or comfort..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-3 text-sm rounded-2xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-white shadow-2xs"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-[#9F4F52] hover:bg-[#85383B] text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask Companion</span>
        </button>
      </form>

    </div>
  );
};
