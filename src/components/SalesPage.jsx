import { useState } from 'react';
import { 
  ArrowRight, Check, CheckCircle2, AlertCircle, Database, Code, Sparkles, Cpu, Zap, 
  Shield, FileSpreadsheet, Layers, Globe, Mail, ArrowUpRight, HelpCircle, Star, MessageSquare 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function SalesPage({ onNavigate }) {
  // Waitlist email form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pricing monthly/yearly toggle state
  const [isYearly, setIsYearly] = useState(false);

  // FAQ open/close state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    setEmailError('');

    // Basic email validation
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    // Simulate API request
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1200);
  };

  const faqs = [
    {
      q: "What is JSON-LD and why do I need it?",
      a: "JSON-LD (JavaScript Object Notation for Linked Data) is a standard format for structured data. Search engines like Google use it to understand the content of your page and display rich snippets (like product reviews, events, recipe ratings, and local business details) in search results. Converting your raw CSV listings to JSON-LD helps boost your SEO visibility instantly."
    },
    {
      q: "Is my data processed on your servers?",
      a: "No. Your data privacy is our priority. The conversion process is done 100% locally in your web browser. Your CSV files and generated schemas never leave your device."
    },
    {
      q: "Can I define custom properties and mappings?",
      a: "Yes! The workspace features a fully interactive Schema Mapper where you can map your CSV headers to standard Schema.org properties, or even enter custom field names to output nested JSON-LD structures."
    },
    {
      q: "What schemas do you support out of the box?",
      a: "We support all primary Schema.org templates including LocalBusiness, Product, Event, Article, Person, Organization, Recipe, and JobPosting, along with a 'Custom Schema' option for advanced implementations."
    },
    {
      q: "How does bulk downloading work?",
      a: "When you upload a CSV with multiple rows, you can choose to download the schemas as a single combined JSON-LD array file, or export them in bulk as a ZIP archive containing individual JSON-LD files named after a column of your choice."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-mono font-bold text-lg shadow-sm">
              S
            </div>
            <span className="font-bold tracking-tight text-lg font-sans">
              Semantix<span className="text-[#2563eb]">.io</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-200">Features</a>
            <a href="#comparison" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-200">Why Us</a>
            <a href="#pricing" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-200">Pricing</a>
            <a href="#faqs" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-200">FAQs</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => onNavigate('workspace')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#2563eb] text-white hover:bg-blue-700 active:bg-blue-800 font-medium text-sm transition-all duration-200 shadow-sm"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] border border-blue-100 dark:border-blue-900/50">
                <Sparkles className="w-3.5 h-3.5" />
                Now in Public Beta
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-zinc-950 dark:text-zinc-50">
                Convert Raw CSVs <br />
                Into Rich <span className="text-[#2563eb]">JSON-LD</span>
              </h1>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0">
                Turn your spreadsheet directories into validated, search-engine-optimized Schema.org structured data in seconds. 100% in-browser, secure, and lightning fast.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => onNavigate('workspace')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-md bg-[#2563eb] text-white hover:bg-blue-700 active:bg-blue-800 font-semibold text-base transition-all duration-200 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 group"
                >
                  Start Converting Free
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <a
                  href="#waitlist"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-base transition-all duration-200"
                >
                  Join the Waitlist
                </a>
              </div>

              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#2563eb]" /> No account required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#2563eb]" /> 100% Client-side
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#2563eb]" /> SEO-Ready output
                </span>
              </div>
            </div>

            {/* Visual Interactive Workspace Mockup */}
            <div className="lg:col-span-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden transition-all duration-200">
                {/* Header bar */}
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">converter_workspace.csv</span>
                  <div className="w-10"></div>
                </div>

                {/* Inside Mockup columns */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 h-80">
                  {/* Left: Input CSV preview */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" /> Input CSV
                      </div>
                      <div className="space-y-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-nowrap">
                        <div className="p-1.5 bg-zinc-200/50 dark:bg-zinc-900/80 rounded font-semibold text-zinc-700 dark:text-zinc-300">
                          id,name,price,rating,url
                        </div>
                        <div className="p-1">101,Acoustic Guitar,349.99,4.8,https://...</div>
                        <div className="p-1">102,Studio Mic,199.50,4.6,https://...</div>
                        <div className="p-1">103,Midi Keyboard,120.00,4.2,https://...</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                      3 columns matched automatically to <span className="font-semibold text-blue-500">Product</span> schema
                    </div>
                  </div>

                  {/* Right: Output JSON-LD preview */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-950 overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                        <Code className="w-3.5 h-3.5 text-green-500" /> Output JSON-LD
                      </div>
                      <pre className="text-[10px] font-mono text-green-400 leading-normal overflow-y-auto max-h-56">
{`{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Acoustic Guitar",
  "offers": {
    "@type": "Offer",
    "price": "349.99",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8"
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section id="comparison" className="py-20 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              The Pain of Manual Structured Data
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Why write tedious mapping scripts or format schemas cell-by-cell when you can autodetect, map, and export hundreds of SEO schemas at once?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Messy Way */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 relative overflow-hidden transition-all duration-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <h3 className="text-xl font-bold mb-6 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> The Broken Way
              </h3>
              <ul className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none">×</span>
                  <span><strong>Time Consuming:</strong> Spending hours writing custom python scripts for every single dataset.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none">×</span>
                  <span><strong>Schema Errors:</strong> Missing comma or wrong nested type breaks the Google Search Console validation.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none">×</span>
                  <span><strong>Security Risk:</strong> Uploading proprietary spreadsheets to remote online converters that store your records.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none">×</span>
                  <span><strong>Scale Bottlenecks:</strong> Hard to convert 10,000 products when converters limit you to 5 rows per run.</span>
                </li>
              </ul>
            </div>

            {/* The Semantix Way */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2563eb] rounded-xl p-8 relative overflow-hidden transition-all duration-200 shadow-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#2563eb]"></div>
              <div className="absolute top-4 right-4 bg-blue-100 dark:bg-blue-950/60 text-[#2563eb] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Highly Recommended
              </div>
              <h3 className="text-xl font-bold mb-6 text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2563eb]" /> The Semantix Way
              </h3>
              <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>Instant Autodetect:</strong> Upload a CSV, select your schema template, and headers map automatically.</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>Realtime Validation:</strong> Generates strict JSON-LD that complies with Schema.org standards instantly.</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>100% Client-Side:</strong> All data is parsed inside your browser memory. Data never touches our servers.</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>Massive Bulk Exports:</strong> Download combined arrays or ZIP files with thousands of structured JSON files.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Built for Growth Teams & SEOs
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              The fastest way to generate structured data at scale. Take control of your Rich Results and SEO visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Smart Schema Mapper</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Connect your CSV headers to standard properties using a clean dropdown interface. Remembers mapping configuration.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Lightning Fast Processing</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Parse and map 5,000 rows in less than 300ms using optimized browser compilation threads.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] flex items-center justify-center mb-4">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">JSON-LD Code Previewer</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Real-time syntax highlighted viewer showing you exactly what the schema code looks like as you map values.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Multiple Schema Layouts</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Choose between Product, Event, LocalBusiness, Recipe, Article, and more. Support custom properties too.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Zero Data Risk</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                No storage. No database syncing. Files are loaded and discarded inside your local state context only.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Bulk ZIP & Combined Output</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Download a single file enclosing a JSON array, or package individual schemas in a ZIP folder named by IDs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Clear, Transaction-Based Pricing
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              No recurring monthly traps. Pay only for the rows you compile, or license your agency for the year.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col justify-between transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Free Trial</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Perfect for testing mappings and small sites.</p>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold tracking-tight">$0</span>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">/forever</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Up to 50 rows per file</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>All 6 Schema.org templates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Live JSON-LD browser preview</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-350 dark:text-zinc-650">
                    <Check className="w-4.5 h-4.5 text-blue-650/40 dark:text-blue-450/40 shrink-0" />
                    <span>Local client-side parsing</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => onNavigate('workspace')}
                className="mt-8 w-full py-2 px-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-all duration-200 cursor-pointer"
              >
                Launch Workspace
              </button>
            </div>

            {/* Single Migration Pass */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2563eb] rounded-xl p-8 flex flex-col justify-between relative shadow-md transition-all duration-200">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#2563eb] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Migration Pass</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Single use token for bulk imports or migrations.</p>
                <div className="mt-6 space-y-1">
                  <div>
                    <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">$19</span>
                    <span className="text-xs text-zinc-500"> / up to 5,000 rows</span>
                  </div>
                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">$30</span>
                    <span className="text-xs text-zinc-500"> / up to 10,000 rows</span>
                  </div>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-650 dark:text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>ZIP & Enriched CSV exports</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Date & price data sanitization</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Global @id brand/publisher nesting</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>100% private, local CPU parsing</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('workspace')}
                className="mt-8 w-full py-2.5 px-4 rounded-md bg-[#2563eb] text-white hover:bg-blue-700 active:bg-blue-800 text-center font-medium text-sm transition-all duration-200 shadow-sm cursor-pointer"
              >
                Go to Workspace & Unlock
              </button>
            </div>

            {/* Annual Agency Pass */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col justify-between transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Annual Agency Pass</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">For agency SEOs and scaling platforms.</p>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold tracking-tight">$499</span>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">/year</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Unlimited runs & rows</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Save mapping presets locally</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>White-labeled GSC validation reporting</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Priority email & Slack support</span>
                  </li>
                </ul>
              </div>
              <a
                href="#waitlist"
                className="mt-8 w-full py-2 px-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-center font-medium text-sm transition-all duration-200"
              >
                Join Waitlist / Purchase
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Have questions about Semantix CSV? We have answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-850/30 transition-all duration-200"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-xl transition-transform duration-200 font-normal ${isOpen ? 'rotate-45' : ''}`}>
                      ＋
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60 pt-4 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Waitlist Call-to-Action Section */}
      <section id="waitlist" className="py-20 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center shadow-lg">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                Join the Waitlist for Automated Pipelines
              </h2>
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
                We are building real-time cloud-sync pipelines that scan your database, Airtable, or live Google Sheets, and update your structured data automatically daily. Be the first to try it.
              </p>

              {isSubmitted ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-400 flex flex-col items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span className="font-bold">You are on the list!</span>
                  <span className="text-xs text-emerald-700/80 dark:text-emerald-450/80">We will email you as soon as early access slots open up.</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        placeholder="name@company.com"
                        className={`w-full px-4 py-2.5 rounded-md border text-sm bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all duration-200 ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-800'}`}
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[#2563eb] text-white hover:bg-blue-700 active:bg-blue-800 font-semibold text-sm transition-all duration-200 disabled:opacity-75 shrink-0 shadow-sm"
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        'Get Early Access'
                      )}
                    </button>
                  </div>
                  {emailError && (
                    <p className="text-left text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {emailError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#2563eb] flex items-center justify-center text-white font-mono font-bold text-xs">
              S
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950 dark:text-zinc-50">
              Semantix<span className="text-[#2563eb]">.io</span>
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} Semantix. All rights reserved. Built with precision and privacy.
          </p>

          <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <a href="#" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-200">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-200">Terms of Service</a>
            <a href="https://schema.org" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-200 flex items-center gap-0.5">
              Schema.org <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
