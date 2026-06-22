'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, Artist } from '@/utils/db';
import Link from 'next/link';
import { Sparkles, Send, Music, ShieldCheck, HelpCircle, DollarSign, Calendar } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  recommendations?: Artist[];
  prefills?: { artistId: string; budget: number };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Greetings. I am your Showtime Elite Concierge. I can recommend artists from our curated Caribbean roster, perform budget matching, check availability, and outline compliance requirements for international routes (US O-Visas, UK Certificates of Sponsorship). \n\nWhat kind of event are you organizing, and what is your target talent budget?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadArtists = async () => {
      const all = await db.getArtists();
      setArtists(all);
    };
    loadArtists();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // NLP parsing for simulation responses
  const generateAIResponse = (input: string): ChatMessage => {
    const text = input.toLowerCase();
    
    // 1. Budget extraction
    let budgetOffer = 50000;
    const match = text.match(/\$?(\d{1,3}),?(\d{3})/);
    if (match) {
      budgetOffer = parseInt(match[0].replace(/[$,]/g, ''));
    }

    // 2. Artist query matching
    const matchesReggae = text.includes('reggae') || text.includes('roots') || text.includes('soul') || text.includes('love');
    const matchesDancehall = text.includes('dancehall') || text.includes('pop') || text.includes('energy');
    const matchesDjs = text.includes('dj') || text.includes('selector') || text.includes('mix') || text.includes('clash');

    let matchesSpecificArtist: Artist | undefined = undefined;
    for (const art of artists) {
      if (text.includes(art.stage_name.toLowerCase()) || text.includes(art.stage_name.split(' ')[0].toLowerCase())) {
        matchesSpecificArtist = art;
        break;
      }
    }

    // Response construction
    if (matchesSpecificArtist) {
      const art = matchesSpecificArtist;
      const isAvailable = art.booking_status === 'Available';
      
      let rateResponse = '';
      if (art.id === 'art-chronixx') rateResponse = 'Chronixx is currently scheduled on his global revival tour route. His guaranteed booking fee starts at $120,000 USD.';
      else if (art.id === 'art-koffee') rateResponse = 'Koffee is booking select international festival routes. Her performance guarantee starts at $75,000 USD.';
      else if (art.id === 'art-beres-hammond') rateResponse = 'Beres Hammond is booking lovers rock galas and summer theaters. Booking fees start at $90,000 USD.';
      else if (art.id === 'art-shenseea') rateResponse = 'Shenseea is booking pop crossovers and dancehall concerts. Booking fees start at $85,000 USD.';
      else rateResponse = 'Estimated booking fee for this roster selection is $20,000 USD.';

      return {
        sender: 'ai',
        text: `Excellent choice. **${art.stage_name}** (${art.genre}) is currently **${art.booking_status}** for select engagements in 2026. \n\n${rateResponse} \n\nFor US venues, a standard O-Visa petition is required (which Showtime processes on our end). For UK routes, a Certificate of Sponsorship is necessary. Would you like me to pre-fill a booking request for ${art.stage_name}?`,
        prefills: { artistId: art.id, budget: art.id === 'art-chronixx' ? 120000 : art.id === 'art-koffee' ? 75000 : 90000 }
      };
    }

    if (matchesReggae) {
      const reggaeArtists = artists.filter(a => a.category === 'Reggae Artists');
      const matchesBudget = reggaeArtists.filter(a => {
        if (a.id === 'art-chronixx') return budgetOffer >= 120000;
        if (a.id === 'art-beres-hammond') return budgetOffer >= 90000;
        if (a.id === 'art-koffee') return budgetOffer >= 75000;
        return true;
      });

      if (matchesBudget.length > 0) {
        return {
          sender: 'ai',
          text: `Based on your event parameters and budget of **$${budgetOffer.toLocaleString()}**, I recommend the following Reggae headliners. All matches are fully cleared for international festival routes:`,
          recommendations: matchesBudget
        };
      } else {
        return {
          sender: 'ai',
          text: `I found our Reggae headliners (Chronixx, Beres Hammond, Koffee), but they generally command performance guarantees starting at $75,000+ USD. \n\nWith your budget of **$${budgetOffer.toLocaleString()}**, I recommend looking into David Rodigan ($20,000 USD) or adjusting your budget to match our main roots/reggae headliners.`,
          recommendations: artists.filter(a => a.id === 'art-rodigan')
        };
      }
    }

    if (matchesDancehall) {
      const dhArtists = artists.filter(a => a.category === 'Dancehall Artists');
      return {
        sender: 'ai',
        text: `For a high-energy dancehall crossover show, I highly recommend **Shenseea** or **Koffee**. Both hold massive global followings and pop chart features (Kanye West, Gunna). \n\nShenseea's bookings start at $85,000 USD. Let me know if you would like me to set up an inquiry outline.`,
        recommendations: artists.filter(a => a.id === 'art-shenseea' || a.id === 'art-koffee')
      };
    }

    if (matchesDjs) {
      return {
        sender: 'ai',
        text: `For sound clashes, selector slots, or radio mix sets, I recommend **David Rodigan MBE** ($20,000 USD). He is available for dates throughout Europe and the Americas.`,
        recommendations: artists.filter(a => a.id === 'art-rodigan')
      };
    }

    // Default fallback
    return {
      sender: 'ai',
      text: `Understood. To match you with the perfect artist, please specify your preferences:
      \n1. **Genre Preference:** Reggae, Dancehall, or Selector/DJ sets?
      \n2. **Offer Range:** Guarantees below $50K, $50K-$100K, or elite headliners ($100K+)?
      \n3. **Event Venue:** Is it an outdoor festival or a corporate gala?
      \n\nAlternatively, you can browse all active performers in our [Talent Directory](/talent) directly.`
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      const aiMsg = generateAIResponse(userMsg.text);
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="ai-assistant-container container">
      
      {/* Header */}
      <div className="assistant-header">
        <span className="gold-badge">Concierge Service</span>
        <h2>AI Booking Concierge</h2>
        <p>Consult our intelligent matching engine regarding rosters, budget tiers, and compliance requirements.</p>
      </div>

      {/* Main Chat layout */}
      <div className="luxury-card chat-workspace glassmorphism">
        
        {/* Left Side: Tips/Capabilities */}
        <div className="chat-sidebar-capabilities">
          <h4>Platform Capabilities</h4>
          <div className="capability-items">
            <div className="cap-item">
              <Music className="cap-icon" />
              <div>
                <h5>Roster Matching</h5>
                <p>&quot;Find reggae artists for a festival&quot;</p>
              </div>
            </div>
            <div className="cap-item">
              <DollarSign className="cap-icon" />
              <div>
                <h5>Budget Clearance</h5>
                <p>&quot;Recommend artists under $90k&quot;</p>
              </div>
            </div>
            <div className="cap-item">
              <Calendar className="cap-icon" />
              <div>
                <h5>Availability Checks</h5>
                <p>&quot;Is Chronixx available?&quot;</p>
              </div>
            </div>
            <div className="cap-item">
              <ShieldCheck className="cap-icon" />
              <div>
                <h5>Logistics Estimates</h5>
                <p>&quot;US O-Visa compliance rules&quot;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Conversation Box */}
        <div className="chat-conversation-box">
          <div className="conversation-messages-list">
            {messages.map((m, idx) => (
              <div key={idx} className={`msg-block ${m.sender}`}>
                <div className="msg-avatar-icon">
                  {m.sender === 'ai' ? <Sparkles className="w-4 h-4" /> : 'U'}
                </div>
                
                <div className="msg-content-wrapper">
                  <div className="msg-text-bubble">
                    <p style={{ whiteSpace: 'pre-line' }}>{m.text}</p>
                  </div>
                  
                  {/* Recommended cards */}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="chat-artist-recommendations-list">
                      {m.recommendations.map(a => (
                        <div key={a.id} className="rec-artist-small-card glassmorphism">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.profile_image} alt={a.stage_name} className="rec-avatar" />
                          <div className="rec-details">
                            <strong>{a.stage_name}</strong>
                            <span>{a.genre}</span>
                          </div>
                          <Link href={`/talent/${a.id}`} className="btn btn-secondary btn-tiny">
                            View Roster
                          </Link>
                          <Link href={`/book?artistId=${a.id}`} className="btn btn-primary btn-tiny">
                            Book Now
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Prefills button link option */}
                  {m.prefills && (
                    <div className="chat-action-button-row">
                      <Link 
                        href={`/book?artistId=${m.prefills.artistId}&budget=${m.prefills.budget}`}
                        className="btn btn-primary btn-sm-padding btn-glow"
                      >
                        Auto Fill Booking Request Form
                      </Link>
                    </div>
                  )}

                </div>
              </div>
            ))}

            {loading && (
              <div className="msg-block ai typing animate-pulse">
                <div className="msg-avatar-icon">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="msg-content-wrapper">
                  <div className="msg-text-bubble typing-bubble">
                    <span>Showtime Concierge is matching roster parameters...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Ask about Reggae headliners, O-Visa guidelines, or check David Rodigan rates..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-icon-only">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      <style jsx>{`
        .ai-assistant-container {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .assistant-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .assistant-header p {
          max-width: 600px;
          margin: 0.5rem auto 0;
          color: var(--text-secondary);
        }

        /* Chat Workspace split */
        .chat-workspace {
          display: grid;
          grid-template-columns: 1fr;
          height: 600px;
          padding: 0;
          overflow: hidden;
        }

        @media (min-width: 992px) {
          .chat-workspace {
            grid-template-columns: 1fr 2.5fr;
          }
        }

        .chat-sidebar-capabilities {
          display: none;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid var(--border-color);
          padding: var(--spacing-lg);
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 992px) {
          .chat-sidebar-capabilities {
            display: flex;
            border-bottom: none;
            border-right: 1px solid var(--border-color);
          }
        }

        .chat-sidebar-capabilities h4 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gold-primary);
          margin-bottom: 4px;
        }

        .capability-items {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cap-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .cap-icon {
          width: 24px;
          height: 24px;
          color: var(--gold-primary);
          background: rgba(212, 175, 55, 0.08);
          padding: 4px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .cap-item h5 {
          font-family: var(--font-body);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .cap-item p {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 2px;
          font-style: italic;
        }

        /* Chat conversation box */
        .chat-conversation-box {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .conversation-messages-list {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .msg-block {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }

        .msg-block.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .msg-avatar-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .ai .msg-avatar-icon {
          background: var(--gold-gradient);
          color: var(--bg-primary);
          box-shadow: var(--glow-gold);
        }

        .user .msg-avatar-icon {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .msg-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .msg-text-bubble {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .ai .msg-text-bubble {
          background: rgba(28,28,33,0.9);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-top-left-radius: 0;
        }

        .user .msg-text-bubble {
          background: var(--gold-gradient);
          color: var(--bg-primary);
          border-top-right-radius: 0;
          font-weight: 500;
        }

        .typing-bubble {
          color: var(--text-muted) !important;
          border-color: rgba(212, 175, 55, 0.05) !important;
          font-style: italic;
        }

        /* Recommended small cards */
        .chat-artist-recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }

        .rec-artist-small-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          flex-wrap: wrap;
        }

        @media (max-width: 576px) {
          .rec-artist-small-card {
            gap: 8px;
          }
          .rec-details {
            width: calc(100% - 60px);
          }
          .rec-artist-small-card .btn-tiny {
            flex-grow: 1;
            text-align: center;
            justify-content: center;
            font-size: 0.72rem;
            padding: 0.5rem 0.75rem;
          }
        }

        .rec-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--gold-primary);
        }

        .rec-details {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .rec-details strong {
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .rec-details span {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .btn-tiny {
          font-size: 0.65rem;
          padding: 0.35rem 0.75rem;
        }

        .chat-action-button-row {
          margin-top: 4px;
        }

        /* Input Row */
        .chat-input-row {
          display: flex;
          gap: 8px;
          padding: 12px 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .chat-input-row input {
          font-size: 0.85rem;
          padding: 8px 12px;
          background: rgba(0,0,0,0.3);
        }

        .btn-icon-only {
          padding: 0.5rem;
          aspect-ratio: 1;
        }
      `}</style>
    </div>
  );
}
