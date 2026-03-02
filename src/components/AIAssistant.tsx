import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  X,
  TrendingUp,
  Tag,
  Lightbulb,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAssistant, type GrokMessage } from '../services/grok';

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Analisar Vendas', prompt: 'Analise meu desempenho de vendas e me dê dicas para melhorar.' },
  { icon: Tag, label: 'Criar Promoção', prompt: 'Me ajude a criar uma promoção atrativa para aumentar as vendas esta semana.' },
  { icon: Lightbulb, label: 'Dicas de Gestão', prompt: 'Me dê 5 dicas práticas de gestão para pequeno varejo.' },
  { icon: MessageSquare, label: 'Script de Venda', prompt: 'Crie um script de abordagem para vendas pelo WhatsApp.' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou o **NIKLAUS AI**, seu assistente inteligente. Posso ajudar com análises de vendas, sugestões de preços, promoções e muito mais. Como posso ajudar?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    const newUserMsg: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMsg]);
    setLoading(true);

    try {
      // Montar histórico para contexto (últimas 6 mensagens)
      const history: GrokMessage[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chatWithAssistant(userMessage, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Erro ao conectar com a IA. Verifique sua conexão e tente novamente.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '👋 Conversa reiniciada! Como posso ajudar você agora?',
      },
    ]);
  };

  // Renderiza markdown simples (negrito)
  const renderContent = (content: string) => {
    return content
      .split('**')
      .map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-neon-blue">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-20 right-0 w-[400px] h-[580px] glass-card flex flex-col overflow-hidden shadow-2xl border-neon-blue/20"
          >
            {/* Header */}
            <div className="p-4 border-b border-border-subtle bg-neon-blue/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neon-blue rounded-full flex items-center justify-center text-black shadow-lg shadow-neon-blue/30">
                  <Bot size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">NIKLAUS AI</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Grok Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                  title="Limpar conversa"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-neon-blue text-black font-medium rounded-tr-none'
                        : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'
                    }`}
                  >
                    {renderContent(msg.content)}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-neon-blue/60 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-neon-blue/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-neon-blue/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={loading}
                  className="shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 hover:text-neon-blue hover:border-neon-blue transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <qp.icon size={10} />
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border-subtle bg-white/5 shrink-0">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Pergunte qualquer coisa..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 outline-none focus:border-neon-blue transition-colors text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neon-blue text-black rounded-lg hover:brightness-110 transition-all disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-neon-blue text-black rounded-full shadow-lg shadow-neon-blue/40 flex items-center justify-center relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={26} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Sparkles size={26} className="group-hover:rotate-12 transition-transform" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-dark-bg animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
