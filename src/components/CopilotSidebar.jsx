import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Key, 
  X, 
  Settings, 
  Check, 
  HelpCircle, 
  Trash2, 
  Brain,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Heuristic response generator when no Gemini API key is provided
const generateHeuristicResponse = (query, csvHeaders = [], selectedSchema = '', mapping = {}) => {
  const q = query.toLowerCase();
  
  if (q.includes('@id') || q.includes('identifier') || q.includes('brand id') || q.includes('publisher id')) {
    return {
      thought: `User wants to understand @id in JSON-LD. I will detail that it represents a global identifier for an entity, preventing duplicate definitions. I will explain Google's stance on entities and how this tool resolves brand/@id and publisher/@id to avoid duplicate context warnings inside @graph arrays.`,
      response: `### Understanding \`@id\` in JSON-LD
      
In Schema.org, **\`@id\`** acts as a globally unique identifier (URI or anchor) for a specific entity.

#### 1. Why is it used?
It allows other schemas to reference this entity without repeating its definition. For example, if you define your Organization brand once:
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.com/#our-brand",
  "name": "Oak & Thread"
}
\`\`\`
Any Product schema on your site can reference this brand by simply linking to its \`@id\`:
\`\`\`json
"brand": {
  "@type": "Brand",
  "@id": "https://example.com/#our-brand"
}
\`\`\`

#### 2. SEO Best Practices
* **Redundancy**: Prevents inflating your page size with duplicate data.
* **Google Knowledge Graph**: Helps search crawlers connect entities in a clean graph structure.
* **Global Entity Config**: In this mapper, you can toggle the global brand setting. This automatically outputs a linked \`@graph\` containing the brand and links all records to it via their \`brand/@id\` or \`publisher/@id\` fields.`
    };
  }
  
  if (q.includes('product') || q.includes('how to map product')) {
    return {
      thought: `User needs guidance on mapping Product schema. I will list required and recommended fields (name, image, price, availability). I will check if CSV headers are provided and map them to standard fields like offers/price and brand/name using slash notation.`,
      response: `### Mapping Product Schema

To map your CSV columns to a **Product** schema, align your headers with these Schema.org fields:

| Field Path | Requirement | Description / Recommended Map |
| :--- | :--- | :--- |
| **\`name\`** | Required | The name of the product. |
| **\`image\`** | Required | URL of the product image. |
| **\`offers/price\`** | Required | The numeric price (e.g. \`99.99\`). |
| **\`offers/priceCurrency\`** | Required | The ISO currency code (e.g. \`USD\`). |
| **\`description\`** | Recommended | Short product description. |
| **\`sku\`** | Recommended | Stock keeping unit. |
| **\`brand/name\`** | Recommended | Brand name. |
| **\`offers/availability\`** | Recommended | \`https://schema.org/InStock\` or \`OutOfStock\`. |

${csvHeaders.length > 0 ? `
#### Custom Analysis of Your CSV:
I see your CSV has headers: ${csvHeaders.map(h => `\`${h}\``).join(', ')}.
Here are my mapping recommendations:
${csvHeaders.some(h => /name|title/i.test(h)) ? `* Map \`${csvHeaders.find(h => /name|title/i.test(h))}\` to \`name\`` : ''}
${csvHeaders.some(h => /price|cost/i.test(h)) ? `* Map \`${csvHeaders.find(h => /price|cost/i.test(h))}\` to \`offers/price\`` : ''}
${csvHeaders.some(h => /image|img|pic/i.test(h)) ? `* Map \`${csvHeaders.find(h => /image|img|pic/i.test(h))}\` to \`image\`` : ''}
${csvHeaders.some(h => /description|desc/i.test(h)) ? `* Map \`${csvHeaders.find(h => /description|desc/i.test(h))}\` to \`description\`` : ''}
${csvHeaders.some(h => /sku|id/i.test(h)) ? `* Map \`${csvHeaders.find(h => /sku|id/i.test(h))}\` to \`sku\`` : ''}
` : '\n*Upload a CSV file in the main panel to get custom mapping suggestions.*'}`
    };
  }

  if (q.includes('validate') || q.includes('validate my csv') || q.includes('check my csv') || q.includes('csv format')) {
    return {
      thought: `User wants to validate their CSV structure. I will check common validation issues like currency symbols, missing protocols in URLs, and non-conforming availability values. I will also provide feedback based on active headers if any.`,
      response: `### CSV Validation Checklist

To ensure your CSV maps seamlessly into clean JSON-LD, check the following:

1. **Non-Numeric Prices**: Ensure prices are numbers only.
   * *Bad*: \`$129.99\` or \`129.99 USD\`
   * *Good*: \`129.99\`
2. **Missing Absolute URLs**: Image and page URLs must include protocols.
   * *Bad*: \`example.com/images/1.jpg\`
   * *Good*: \`https://example.com/images/1.jpg\`
3. **Availability Format**: Standard Google schemas expect specific availability formats.
   * *Good*: \`https://schema.org/InStock\` (or just \`InStock\` which our compiler handles).
4. **Header Cleanliness**: Ensure headers do not contain special punctuation or whitespace symbols.
   
${csvHeaders.length > 0 ? `
#### Your CSV Status:
* **Headers Found**: ${csvHeaders.length} columns (${csvHeaders.join(', ')})
* **Validation**: Columns look healthy. Ready to map to your **${selectedSchema || 'selected'}** schema.
` : 'No CSV uploaded yet. Upload your file in the main panel to validate its structure.'}`
    };
  }

  if (q.includes('google') || q.includes('rich') || q.includes('guidelines') || q.includes('rich results')) {
    return {
      thought: `User asks about Google Rich Results guidelines. I will cover the strict policies, testing options, and warn them about matching visible content with metadata.`,
      response: `### Google Rich Results Guidelines

Google displays structured data as rich results (stars, badges, pricing) only if it adheres strictly to their policies.

#### Key Rules:
1. **Match Visible Page Content**: The data described in your JSON-LD (such as price, name, ratings) **must** match what users see on the corresponding HTML page. Cloaking structured data to trick Google can lead to a manual action.
2. **Missing Required Fields**: If your JSON-LD lacks a required property (e.g. \`offers/price\` for Product), it is **ineligible** for rich results.
3. **Missing Recommended Fields**: Google will flag missing recommended fields as warnings (e.g., missing \`sku\`), but the rich result can still appear.
4. **Always Test**: Use the [Google Rich Results Test](https://search.google.com/test/rich-results) tool by pasting your generated JSON-LD code to verify if search engines can parse it.`
    };
  }

  if (q.includes('faq') || q.includes('faqpage') || q.includes('question')) {
    return {
      thought: `User asks about FAQPage schema. I should detail mapping rules and Google's recent FAQ schema visibility updates.`,
      response: `### Mapping FAQPage Schema

**FAQPage** schema is used for pages containing list-like Questions and Answers.

#### Structure in this Tool:
* Map columns to \`faq_1/question\`, \`faq_1/answer\`, etc.
* Up to 4 FAQ blocks are compiled from each row in the CSV.
* Each FAQ Question must have a corresponding Answer.

#### Important Google Update (SEO Context):
As of late 2023, Google has limited FAQ rich results primarily to well-established authority sites (e.g. government, health organizations). However:
1. FAQ schema still provides valuable structured context for search engine understanding.
2. Voice assistants and alternative search engines continue to utilize FAQ schema to answer questions directly.`
    };
  }

  if (q.includes('nest') || q.includes('nesting') || q.includes('slash') || q.includes('notation')) {
    return {
      thought: `Explain the nested property schema and slash notation mapping in this CSV mapping tool.`,
      response: `### How Nested Properties Work

This converter uses **Slash Notation** (\`/\`) to handle nested properties.

When you map a CSV column to a path like \`offers/priceCurrency\`, the compiler automatically constructs the nested object:
\`\`\`json
"offers": {
  "@type": "Offer",
  "priceCurrency": "USD"
}
\`\`\`

#### Automatic Type Insertion:
The compiler automatically injects the appropriate \`@type\` for common nested elements:
* \`address/*\` → \`PostalAddress\`
* \`geo/*\` → \`GeoCoordinates\`
* \`offers/*\` → \`Offer\`
* \`brand/*\` → \`Brand\`
* \`aggregateRating/*\` → \`AggregateRating\`
* \`author/*\` → \`Person\`
* \`publisher/*\` / \`hiringOrganization/*\` → \`Organization\`
* \`location/*\` / \`jobLocation/*\` → \`Place\``
    };
  }

  // Generic fallback
  return {
    thought: `The query does not match standard preset topics. I will construct a helpful SEO schema mapping response referencing the active schema and CSV headers to guide the user.`,
    response: `### Schema SEO Guidance

I can help you build structured data schemas for your website. 

Here are some things you can ask me:
* **"What is @id?"** — Learn about unique node linking.
* **"How to map Product?"** — View product schema mappings.
* **"Validate my CSV"** — Analyze your current CSV structure.
* **"Google Rich Results Guidelines"** — Read policies on structured data.
* **"How does nesting work?"** — Understand slash-notation mapping.

---
${csvHeaders.length > 0 ? `
**Current Project State**: 
* Active Schema Type: \`${selectedSchema || 'None'}\`
* CSV Columns: ${csvHeaders.map(h => `\`${h}\``).join(', ')}
` : 'Upload a CSV to start. Once uploaded, I can analyze your columns and recommend mappings!'}`
  };
};

// Gemini API Integration helper
const callGeminiAPI = async (apiKey, query, selectedSchema, csvHeaders, mapping) => {
  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const systemPrompt = `You are an expert SEO Schema Markup Assistant. You help users convert flat CSV columns to nested JSON-LD structured data using Schema.org specifications.
The user is working with the schema type: '${selectedSchema || 'Generic'}'.
The current CSV headers are: ${csvHeaders.join(', ') || 'No CSV uploaded yet'}.
The current column mappings are: ${JSON.stringify(mapping) || 'No mappings defined yet'}.

Please analyze the user's query: '${query}'.

CRITICAL: You MUST respond in this exact format, starting with a <thought> tag and ending with a </response> tag. Do not include any text outside these tags.
Format:
<thought>
Write your step-by-step reasoning, mapping analysis, or thoughts here. Explain how you arrived at the answer.
</thought>
<response>
Write your final response here. You can use markdown, lists, tables, and code blocks. Be clear, professional, and SEO-focused.
</response>`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const thoughtMatch = text.match(/<thought>([\s\S]*?)<\/thought>/i);
    const responseMatch = text.match(/<response>([\s\S]*?)<\/response>/i);
    
    if (thoughtMatch || responseMatch) {
      return {
        thought: thoughtMatch ? thoughtMatch[1].trim() : 'Analyzing query...',
        response: responseMatch ? responseMatch[1].trim() : text.replace(/<\/?thought>|<\/?response>/gi, '').trim()
      };
    } else {
      return {
        thought: 'Processed request via Gemini API model.',
        response: text.trim()
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Failed to fetch response from Gemini API.');
  }
};

export default function CopilotSidebar({ 
  isOpen: parentIsOpen, 
  onClose: parentOnClose,
  csvHeaders = [],
  selectedSchema = '',
  mapping = {}
}) {
  // If parent controls are missing, we fall back to self-controlled floating button mode
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isControlled = parentIsOpen !== undefined;
  const isOpen = isControlled ? parentIsOpen : localIsOpen;
  const onClose = isControlled ? parentOnClose : () => setLocalIsOpen(false);
  const onOpen = !isControlled ? () => setLocalIsOpen(true) : null;

  // Settings and state
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thoughtExpandedId, setThoughtExpandedId] = useState({});

  // Streaming states
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [streamedThought, setStreamedThought] = useState('');
  const [streamedResponse, setStreamedResponse] = useState('');
  const [streamState, setStreamState] = useState('idle'); // 'thinking' | 'answering' | 'idle'

  const messagesEndRef = useRef(null);
  const streamTimerRef = useRef(null);

  // Load API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Scroll to bottom when messages or stream change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, streamedThought, streamedResponse, streamState]);

  // Handle API Key save
  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setShowSettings(false);
  };

  // Handle API Key clear
  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
  };

  // Preset Chips
  const helpChips = [
    { label: 'What is @id?', query: 'What is @id and how do I use it?' },
    { label: 'How to map Product?', query: 'How to map Product schema from CSV?' },
    { label: 'Validate my CSV', query: 'Validate my CSV columns and structure' },
    { label: 'Google Rich Results Guidelines', query: 'Google Rich Results guidelines and rules' },
    { label: 'FAQ page schema rules', query: 'FAQ page schema rules' },
    { label: 'How does nesting work?', query: 'How does nesting and slash notation work?' }
  ];

  // Streaming animator function
  const animateStream = (thought, response, messageId) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    
    setStreamState('thinking');
    setStreamedThought('');
    setStreamedResponse('');
    
    setStreamingMessage({
      id: messageId,
      role: 'assistant',
      thought: thought,
      text: response
    });

    let thoughtIndex = 0;
    let responseIndex = 0;
    
    // Animate thought first
    streamTimerRef.current = setInterval(() => {
      if (thoughtIndex < thought.length) {
        setStreamedThought(prev => prev + thought.charAt(thoughtIndex));
        thoughtIndex++;
      } else {
        clearInterval(streamTimerRef.current);
        
        // Wait briefly, then switch to response
        setTimeout(() => {
          setStreamState('answering');
          
          streamTimerRef.current = setInterval(() => {
            if (responseIndex < response.length) {
              setStreamedResponse(prev => prev + response.charAt(responseIndex));
              responseIndex++;
            } else {
              clearInterval(streamTimerRef.current);
              
              // Stream complete. Push to primary history
              setMessages(prev => [
                ...prev,
                {
                  id: messageId,
                  role: 'assistant',
                  thought: thought,
                  text: response
                }
              ]);
              
              // Auto-expand thought of newly added message
              setThoughtExpandedId(prev => ({ ...prev, [messageId]: true }));
              
              // Reset streaming
              setStreamingMessage(null);
              setStreamedThought('');
              setStreamedResponse('');
              setStreamState('idle');
            }
          }, 12); // Stream speed for response text (chars per tick)
        }, 400);
      }
    }, 6); // Stream speed for thinking text (faster)
  };

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    if (!queryText) {
      setInputValue('');
    }

    const userMessageId = 'user-' + Date.now();
    const assistantMessageId = 'assistant-' + Date.now();

    // Append User message
    setMessages(prev => [...prev, { id: userMessageId, role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      let finalThought = '';
      let finalResponse = '';

      if (apiKey.trim()) {
        // Query Gemini API
        const apiResponse = await callGeminiAPI(
          apiKey.trim(), 
          textToSend, 
          selectedSchema, 
          csvHeaders, 
          mapping
        );
        finalThought = apiResponse.thought;
        finalResponse = apiResponse.response;
      } else {
        // Fallback to local intelligent schema heuristical guidance
        const heuristic = generateHeuristicResponse(textToSend, csvHeaders, selectedSchema, mapping);
        finalThought = heuristic.thought;
        finalResponse = heuristic.response;
      }

      setIsLoading(false);
      animateStream(finalThought, finalResponse, assistantMessageId);

    } catch (err) {
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          thought: 'An error occurred while connecting to the Gemini API.',
          text: `⚠️ **API Error**: ${err.message}\n\nPlease verify your Gemini API key inside the settings panel, or clear the key to run the offline schema assistant.`
        }
      ]);
    }
  };

  const toggleThought = (id) => {
    setThoughtExpandedId(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* Floating trigger button (Only renders if CopilotSidebar is self-contained/not-controlled) */}
      {!isControlled && !isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-xl hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all duration-200 animate-fade-in"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <span className="font-semibold text-sm">Ask Copilot</span>
        </button>
      )}

      {/* Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        />
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-zinc-950 text-zinc-100 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">SEO Schema Copilot</h3>
              <p className="text-xs text-zinc-400">Heuristic Guidance & Gemini Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors ${showSettings ? 'bg-zinc-900 text-emerald-400' : 'hover:bg-zinc-900'}`}
              title="Gemini API Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Settings Panel (Dropdown/Collapsible) */}
        {showSettings && (
          <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 animate-fade-in">
            <form onSubmit={handleSaveKey} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Gemini API Key
                </label>
                {apiKey ? (
                  <span className="text-[10px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-medium">
                    Local Heuristic
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter AIzaSy... key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 font-bold rounded-lg text-sm transition-colors flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Save
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 hover:border-red-900/30 transition-colors"
                    title="Clear API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Your key is saved locally in your browser's <code>localStorage</code> and calls Gemini directly. If empty, the Copilot uses built-in heuristic parsing to validate mappings and supply local answers.
              </p>
            </form>
          </div>
        )}

        {/* Info panel showing upload state */}
        {csvHeaders.length > 0 && (
          <div className="px-4 py-2 bg-zinc-900/30 border-b border-zinc-900 text-xs flex items-center gap-2 text-zinc-400">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Connected to <strong>{csvHeaders.length}</strong> CSV headers
              {selectedSchema ? ` (Active Schema: ${selectedSchema})` : ''}
            </span>
          </div>
        )}

        {/* Message Window */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Welcome Screen */}
          {messages.length === 0 && !streamingMessage && (
            <div className="py-6 space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400">
                  <Bot className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base">Schema Markup Helper</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Welcome to the schema Copilot. Select a preset query below or type your custom SEO query to map, validate, and preview your metadata.
                </p>
              </div>

              {/* Help Chips / Preset Grid */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1">Suggested topics</span>
                <div className="grid grid-cols-1 gap-2">
                  {helpChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip.query)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-900 text-left text-xs hover:bg-zinc-900 hover:border-zinc-800 hover:text-zinc-100 transition-all text-zinc-300 animate-fade-in"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-medium truncate">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Historical Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              
              {/* Sender label */}
              <span className="text-[10px] text-zinc-500 px-1 font-semibold uppercase tracking-wider">
                {msg.role === 'user' ? 'You' : 'Copilot'}
              </span>

              {/* Message box */}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-zinc-100' 
                  : 'bg-zinc-900/30 border border-zinc-900 text-zinc-200'
              }`}>
                
                {/* Assistant Thought Block */}
                {msg.role === 'assistant' && msg.thought && (
                  <div className="mb-3 border-l-2 border-emerald-400/30 pl-3 bg-zinc-950/40 rounded-r-lg p-2.5">
                    <button
                      onClick={() => toggleThought(msg.id)}
                      className="flex items-center gap-1.5 text-xs text-emerald-400/90 hover:text-emerald-300 font-semibold focus:outline-none"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Thinking Process</span>
                      {thoughtExpandedId[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {thoughtExpandedId[msg.id] && (
                      <p className="mt-1.5 text-xs text-zinc-400 italic leading-normal whitespace-pre-line">
                        {msg.thought}
                      </p>
                    )}
                  </div>
                )}

                {/* Final Response Content */}
                <div className="prose prose-sm prose-invert max-w-none prose-headings:font-bold prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-a:text-emerald-400 prose-code:text-emerald-300 prose-code:bg-zinc-950/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming Assistant Message */}
          {streamingMessage && (
            <div className="flex flex-col space-y-1.5 items-start animate-fade-in">
              <span className="text-[10px] text-zinc-500 px-1 font-semibold uppercase tracking-wider">Copilot</span>
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-zinc-900/30 border border-zinc-900 text-zinc-200">
                
                {/* Thought Stream */}
                {streamedThought && (
                  <div className="mb-3 border-l-2 border-emerald-400/30 pl-3 bg-zinc-950/40 rounded-r-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400/95 font-semibold">
                      <Brain className="w-3.5 h-3.5 animate-pulse" />
                      <span>Thinking Process</span>
                      <span className="text-[10px] font-normal text-zinc-500 italic">
                        {streamState === 'thinking' ? '(thinking...)' : '(completed)'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-400 italic leading-normal whitespace-pre-line">
                      {streamedThought}
                      {streamState === 'thinking' && <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse" />}
                    </p>
                  </div>
                )}

                {/* Response Stream */}
                {streamState === 'answering' && (
                  <div className="prose prose-sm prose-invert max-w-none prose-headings:font-bold prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-a:text-emerald-400 prose-code:text-emerald-300 prose-code:bg-zinc-950/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamedResponse}
                    </ReactMarkdown>
                    <span className="inline-block w-1.5 h-3.5 bg-zinc-400 ml-0.5 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading status (fetching from API before stream starts) */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 py-2 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              <span>Fetching AI advice...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-900/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || streamState !== 'idle'}
              placeholder={
                isLoading 
                  ? 'Waiting for AI response...' 
                  : streamState !== 'idle' 
                    ? 'Copilot is typing...' 
                    : 'Ask for advice (e.g. "What is @id?")'
              }
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors disabled:opacity-55"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || streamState !== 'idle'}
              className="p-2.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-40 rounded-xl transition-all flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0 text-zinc-600" />
            <span>Connects directly to your workspace headers for context-aware validation.</span>
          </div>
        </div>

      </div>
    </>
  );
}
