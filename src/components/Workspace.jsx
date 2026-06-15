import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { 
  FileSpreadsheet, Database, Code, Shield, Download, RefreshCw, Copy, Check, 
  Trash2, Sliders, ChevronLeft, ChevronRight, HelpCircle, Info, Settings, Plus, Sparkles 
} from 'lucide-react';
import { compileRow, compileDataset } from '../utils/compiler';
import { SUPPORTED_SCHEMAS } from '../utils/schemaDefinitions';
import ThemeToggle from './ThemeToggle';
import CopilotSidebar from './CopilotSidebar';

export default function Workspace({ onNavigate }) {
  // CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Schema state
  const [selectedSchemaKey, setSelectedSchemaKey] = useState('Product');
  const [mapping, setMapping] = useState({});
  const [globalConfig, setGlobalConfig] = useState({
    enableGlobalBrand: false,
    brandId: '#brand',
    brandName: '',
    brandUrl: '',
    brandLogo: '',
  });

  // UI State
  const [previewRowIndex, setPreviewRowIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [zipNamingColumn, setZipNamingColumn] = useState('');
  
  // Paid Gate States
  const [activeLimit, setActiveLimit] = useState(50);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState(null);
  const [checkoutState, setCheckoutState] = useState('selection');
  
  const fileInputRef = useRef(null);

  const selectedSchema = SUPPORTED_SCHEMAS[selectedSchemaKey];

  // Load limit from localStorage on startup
  useEffect(() => {
    const savedLimit = localStorage.getItem('activeLimit');
    if (savedLimit) {
      const parsed = Number(savedLimit);
      setActiveLimit(isNaN(parsed) ? Infinity : parsed);
    }
  }, []);

  // Run Auto-Mapping when schema or CSV headers change
  useEffect(() => {
    if (csvHeaders.length > 0 && selectedSchema) {
      autoMapFields();
    }
  }, [selectedSchemaKey, csvHeaders]);

  // Keep preview row within bounds of active limit
  useEffect(() => {
    const maxIdx = Math.min(csvData.length, activeLimit) - 1;
    if (previewRowIndex > maxIdx && maxIdx >= 0) {
      setPreviewRowIndex(maxIdx);
    }
  }, [activeLimit, csvData.length]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      processFile(file);
    } else {
      setParseError('Please drop a valid CSV file.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setCsvFile(file);
    setIsParsing(true);
    setParseError('');
    setCsvHeaders([]);
    setCsvData([]);
    setPreviewRowIndex(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError('Failed to parse CSV. Please check formatting.');
          return;
        }
        
        if (results.data.length === 0) {
          setParseError('CSV file appears to be empty.');
          return;
        }

        const headers = Object.keys(results.data[0]);
        setCsvHeaders(headers);
        setCsvData(results.data);
        
        // Find a suitable column for naming ZIP files
        const possibleNamingCols = ['sku', 'id', 'name', 'title', 'slug', 'url'];
        const found = headers.find(h => possibleNamingCols.includes(h.toLowerCase()));
        setZipNamingColumn(found || headers[0] || '');
      },
      error: (err) => {
        setIsParsing(false);
        setParseError(`Error parsing CSV: ${err.message}`);
      }
    });
  };

  const autoMapFields = () => {
    if (!selectedSchema || csvHeaders.length === 0) return;

    const newMapping = {};
    
    selectedSchema.fields.forEach(field => {
      const path = field.path;
      const label = field.label.toLowerCase();
      const cleanPath = path.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check for direct match
      let matchedHeader = csvHeaders.find(h => h.toLowerCase() === path.toLowerCase());
      
      // Check for clean path match (e.g. brand/name matching brandname)
      if (!matchedHeader) {
        matchedHeader = csvHeaders.find(h => h.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanPath);
      }

      // Check for label match (e.g. "Product Name" matching "name")
      if (!matchedHeader) {
        matchedHeader = csvHeaders.find(h => h.toLowerCase() === label || label.includes(h.toLowerCase()));
      }

      // Semantic mapping aliases
      if (!matchedHeader) {
        const aliases = {
          'name': ['title', 'headline', 'item_name', 'product_name', 'business_name', 'event_name', 'job_title'],
          'image': ['img', 'photo', 'picture', 'image_url', 'logo'],
          'description': ['desc', 'summary', 'body', 'content'],
          'sku': ['id', 'item_id', 'product_id', 'reference'],
          'offers/price': ['price', 'sale_price', 'amount', 'cost'],
          'offers/priceCurrency': ['currency', 'curr'],
          'url': ['link', 'website', 'href', 'permalink'],
          'telephone': ['phone', 'tel', 'contact'],
          'startDate': ['date', 'start_time', 'time'],
          'address/streetAddress': ['address', 'street', 'location'],
          'address/addressLocality': ['city', 'town'],
          'address/addressRegion': ['state', 'region', 'province'],
          'address/postalCode': ['zip', 'zipcode', 'postcode'],
          'address/addressCountry': ['country'],
        };

        const fieldAliasKeys = Object.keys(aliases);
        const matchingKey = fieldAliasKeys.find(k => path.endsWith(k));
        if (matchingKey) {
          const list = aliases[matchingKey];
          matchedHeader = csvHeaders.find(h => list.includes(h.toLowerCase()));
        }
      }

      if (matchedHeader) {
        newMapping[path] = { type: 'column', value: matchedHeader };
      } else {
        // Fallback for fields that have default values
        if (path === 'offers/priceCurrency') {
          newMapping[path] = { type: 'static', value: 'USD' };
        } else if (path === 'author/type') {
          newMapping[path] = { type: 'static', value: 'Person' };
        } else if (path === 'eventAttendanceMode') {
          newMapping[path] = { type: 'static', value: 'https://schema.org/OnlineEventAttendanceMode' };
        } else if (path === 'eventStatus') {
          newMapping[path] = { type: 'static', value: 'https://schema.org/EventScheduled' };
        } else {
          newMapping[path] = null;
        }
      }
    });

    setMapping(newMapping);
  };

  const handleMapChange = (path, type, value) => {
    setMapping(prev => ({
      ...prev,
      [path]: value ? { type, value } : null
    }));
  };

  const clearFile = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setParseError('');
    setPreviewRowIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getCompiledRowJSON = () => {
    if (csvData.length === 0 || !selectedSchema) return '{}';
    const row = csvData[previewRowIndex];
    const compiled = compileRow(row, mapping, selectedSchema.type, globalConfig);
    return JSON.stringify(compiled, null, 2);
  };

  const copyToClipboard = () => {
    const json = getCompiledRowJSON();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadSingleJSON = () => {
    const json = getCompiledRowJSON();
    const blob = new Blob([json], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Attempt to name file based on dynamic name
    const row = csvData[previewRowIndex];
    const nameMapping = mapping['name'] || mapping['title'];
    let nameVal = 'schema';
    if (nameMapping && nameMapping.type === 'column') {
      nameVal = row[nameMapping.value] ? row[nameMapping.value].toLowerCase().replace(/[^a-z0-9]/g, '_') : 'schema';
    }
    
    a.href = url;
    a.download = `${nameVal}_${selectedSchemaKey.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCombinedJSON = () => {
    const dataToProcess = csvData.slice(0, activeLimit);
    const compiled = compileDataset(dataToProcess, mapping, selectedSchema.type, globalConfig);
    const json = JSON.stringify(compiled, null, 2);
    const blob = new Blob([json], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combined_${selectedSchemaKey.toLowerCase()}_schemas.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBulkZip = () => {
    setIsExporting(true);
    const zip = new JSZip();
    const dataToProcess = csvData.slice(0, activeLimit);

    dataToProcess.forEach((row, index) => {
      const compiled = compileRow(row, mapping, selectedSchema.type, globalConfig);
      
      // Determine file name from mapping naming column or index
      let nameValue = `schema_${index + 1}`;
      if (zipNamingColumn && row[zipNamingColumn]) {
        nameValue = row[zipNamingColumn].toString().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      } else {
        const nameMap = mapping['name'] || mapping['title'];
        if (nameMap && nameMap.type === 'column' && row[nameMap.value]) {
          nameValue = row[nameMap.value].toString().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        }
      }

      zip.file(`${nameValue}.json`, JSON.stringify(compiled, null, 2));
    });

    zip.generateAsync({ type: 'blob' }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_${selectedSchemaKey.toLowerCase()}_schemas.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }).catch((err) => {
      console.error(err);
      setIsExporting(false);
    });
  };

  const downloadEnrichedCSV = () => {
    if (csvData.length === 0) return;
    setIsExporting(true);
    
    const dataToProcess = csvData.slice(0, activeLimit);
    const enrichedData = dataToProcess.map(row => {
      const compiled = compileRow(row, mapping, selectedSchema.type, globalConfig);
      return {
        ...row,
        schema_json_ld: JSON.stringify(compiled)
      };
    });

    const csvString = Papa.unparse(enrichedData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched_${selectedSchemaKey.toLowerCase()}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const handleSimulateCheckout = (limitValue) => {
    setCheckoutState('processing');
    setTimeout(() => {
      setCheckoutState('success');
      setActiveLimit(limitValue);
      localStorage.setItem('activeLimit', String(limitValue));
    }, 1500);
  };

  // Basic highlight styling helper for JSON-LD keys and values
  const highlightJSON = (jsonString) => {
    return jsonString.split('\n').map((line, idx) => {
      // Basic formatting for presentation
      const keyRegex = /"([^"]+)":/g;
      const typeRegex = /"@type":|"@context":/g;
      let formatted = line;

      // Escape HTML tags to prevent rendering issues
      formatted = formatted.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      return (
        <div key={idx} className="min-h-[1.2rem] whitespace-pre font-mono">
          {formatted.includes('"@type"') || formatted.includes('"@context"') ? (
            <span className="text-blue-400 font-bold">{line}</span>
          ) : line.includes('":') ? (
            <>
              <span className="text-purple-400">{line.substring(0, line.indexOf('":') + 2)}</span>
              <span className="text-emerald-400">{line.substring(line.indexOf('":') + 2)}</span>
            </>
          ) : (
            <span className="text-zinc-400">{line}</span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-200">
      
      {/* Workspace Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('landing')} 
              className="text-xs font-semibold px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-400 transition-all duration-200"
            >
              &larr; Back to Landing Page
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm font-sans">
                Workspace <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs">v1.0</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCopilot(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>SEO Copilot</span>
            </button>
            <ThemeToggle />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all duration-200 ${showSettings ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50' : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title="Global Schema Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Row Limiter Alert */}
        {csvData.length > activeLimit && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Row Limit Reached</p>
                <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                  You uploaded <span className="font-bold text-amber-650 dark:text-amber-400">{csvData.length}</span> rows. Your current plan compiles and exports only the first {activeLimit === Infinity ? 'unlimited' : activeLimit} rows.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setCheckoutState('selection');
                setShowUnlockModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              Upgrade Limit / Unlock
            </button>
          </div>
        )}

        {/* Global Configuration settings (Collapsible) */}
        {showSettings && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-md font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2563eb]" /> Global Publisher & Brand Settings
              </h3>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Inject common nodes across schemas</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={globalConfig.enableGlobalBrand}
                    onChange={(e) => setGlobalConfig(prev => ({ ...prev, enableGlobalBrand: e.target.checked }))}
                    className="rounded border-zinc-300 dark:border-zinc-800 text-[#2563eb] focus:ring-[#2563eb]"
                  />
                  <span>Link Brand / Publisher</span>
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                  Toggle to auto-link all schema author, brand, and publisher fields to a single nested entity instead of manual cell mapping.
                </p>
              </div>

              {globalConfig.enableGlobalBrand && (
                <>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Brand Name</label>
                    <input
                      type="text"
                      value={globalConfig.brandName}
                      onChange={(e) => setGlobalConfig(prev => ({ ...prev, brandName: e.target.value }))}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Brand ID</label>
                    <input
                      type="text"
                      value={globalConfig.brandId}
                      onChange={(e) => setGlobalConfig(prev => ({ ...prev, brandId: e.target.value }))}
                      placeholder="e.g. #brand"
                      className="w-full px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Brand Website</label>
                    <input
                      type="text"
                      value={globalConfig.brandUrl}
                      onChange={(e) => setGlobalConfig(prev => ({ ...prev, brandUrl: e.target.value }))}
                      placeholder="e.g. https://acme.co"
                      className="w-full px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Logo Image URL</label>
                    <input
                      type="text"
                      value={globalConfig.brandLogo}
                      onChange={(e) => setGlobalConfig(prev => ({ ...prev, brandLogo: e.target.value }))}
                      placeholder="https://acme.co/logo.png"
                      className="w-full px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: File Upload & Mapping */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* CSV File Upload Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 relative overflow-hidden transition-all duration-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-500" /> 1. Upload CSV File
              </h2>

              {!csvFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-10 text-center cursor-pointer hover:border-[#2563eb] dark:hover:border-[#2563eb] transition-colors duration-200 bg-zinc-50 dark:bg-zinc-950"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FileSpreadsheet className="w-10 h-10 text-zinc-400" />
                    <div>
                      <span className="font-semibold text-sm text-[#2563eb]">Click to upload</span> or drag and drop
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Supports standard .csv tables</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold truncate max-w-xs">{csvFile.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {csvData.length} records parsed successfully
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {parseError && (
                <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  {parseError}
                </div>
              )}
            </div>

            {/* Schema Mapper Card */}
            {csvData.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 shadow-sm animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" /> 2. Map Columns to Schema fields
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Choose a Schema.org template and match your CSV headers to properties.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSchemaKey}
                      onChange={(e) => setSelectedSchemaKey(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      {Object.keys(SUPPORTED_SCHEMAS).map(k => (
                        <option key={k} value={k}>{SUPPORTED_SCHEMAS[k].name}</option>
                      ))}
                    </select>
                    <button
                      onClick={autoMapFields}
                      className="p-2 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all duration-200"
                      title="Run automap utility"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg mb-6 border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Schema description:</span> {selectedSchema.description}
                  </p>
                </div>

                {/* Fields list */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {selectedSchema.fields.map((field) => {
                    const fieldMap = mapping[field.path] || null;
                    return (
                      <div 
                        key={field.path} 
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
                      >
                        {/* Field info */}
                        <div className="md:col-span-5 space-y-0.5">
                          <label className="text-xs font-bold flex items-center gap-1.5">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500" title="Required field">*</span>
                            )}
                            {!field.required && !field.recommended && (
                              <span className="text-[9px] px-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-normal">Optional</span>
                            )}
                            {field.recommended && (
                              <span className="text-[9px] px-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-500 font-semibold">Recommended</span>
                            )}
                          </label>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal max-w-xs">{field.description}</p>
                          {field.example && (
                            <p className="text-[9px] text-zinc-400 font-mono italic">Eg: {field.example}</p>
                          )}
                        </div>

                        {/* Mapping selection dropdown */}
                        <div className="md:col-span-3">
                          <select
                            value={fieldMap ? fieldMap.type : 'unmapped'}
                            onChange={(e) => {
                              const type = e.target.value;
                              if (type === 'unmapped') {
                                handleMapChange(field.path, null, null);
                              } else if (type === 'static') {
                                handleMapChange(field.path, 'static', '');
                              } else {
                                handleMapChange(field.path, 'column', csvHeaders[0] || '');
                              }
                            }}
                            className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                          >
                            <option value="unmapped">-- Unmapped --</option>
                            <option value="column">Map to CSV Column</option>
                            <option value="static">Static Text Value</option>
                          </select>
                        </div>

                        {/* Value Input column depending on selection */}
                        <div className="md:col-span-4">
                          {fieldMap?.type === 'column' && (
                            <select
                              value={fieldMap.value}
                              onChange={(e) => handleMapChange(field.path, 'column', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-blue-500 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                            >
                              {csvHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          )}

                          {fieldMap?.type === 'static' && (
                            <input
                              type="text"
                              value={fieldMap.value}
                              onChange={(e) => handleMapChange(field.path, 'static', e.target.value)}
                              placeholder="Type static value..."
                              className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                            />
                          )}

                          {!fieldMap && (
                            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic p-1.5">
                              Value not outputted
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT VIEW PANEL: Live Preview & Exports */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Live Preview Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 shadow-sm flex flex-col justify-between min-h-[350px]">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-500" /> 3. Live Structured Data Preview
                  </h2>
                  
                  {csvData.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewRowIndex(prev => Math.max(0, prev - 1))}
                        disabled={previewRowIndex === 0}
                        className="p-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50 transition-all duration-200"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Row {previewRowIndex + 1}/{Math.min(csvData.length, activeLimit)}
                      </span>
                      <button
                        onClick={() => setPreviewRowIndex(prev => Math.min(Math.min(csvData.length, activeLimit) - 1, prev + 1))}
                        disabled={previewRowIndex === Math.min(csvData.length, activeLimit) - 1}
                        className="p-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50 transition-all duration-200"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {csvData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 gap-3 text-zinc-400 dark:text-zinc-500">
                    <Code className="w-10 h-10" />
                    <span className="text-sm font-medium">Upload a CSV to view output structured data</span>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute right-2 top-2 z-10 flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="p-1.5 rounded bg-zinc-800/85 hover:bg-zinc-800 text-white font-medium text-xs flex items-center gap-1.5 transition-all duration-200"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={downloadSingleJSON}
                        className="p-1.5 rounded bg-zinc-800/85 hover:bg-zinc-800 text-white font-medium text-xs flex items-center gap-1.5 transition-all duration-200"
                        title="Download single row schema"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>

                    <div className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-4 font-mono text-xs overflow-auto max-h-[360px] text-green-400">
                      {highlightJSON(getCompiledRowJSON())}
                    </div>
                  </div>
                )}
              </div>

              {csvData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                  <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Schema conforms to standard JSON-LD structures. Run test in search validator.</span>
                </div>
              )}
            </div>

            {/* Bulk Exports Options Card */}
            {csvData.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 shadow-sm animate-fade-in">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#2563eb]" /> 4. Bulk Export Options
                </h2>
                
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  Convert the first <span className="font-bold text-[#2563eb]">{Math.min(csvData.length, activeLimit)}</span> parsed rows (limit: {activeLimit === Infinity ? 'Unlimited' : activeLimit}) into validated JSON-LD records. Choose your preferred output delivery.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Option 1: Array Graph file */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950">
                    <div>
                      <h3 className="text-xs font-bold mb-1 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Single Combined File</h3>
                      <h4 className="text-sm font-semibold mb-2 text-zinc-800 dark:text-zinc-200">JSON-LD Graph Array</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                        All compiled records wrapped in a single combined JSON-LD file using the standard schema @graph format.
                      </p>
                    </div>
                    
                    <button
                      onClick={downloadCombinedJSON}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white font-medium text-xs transition-all duration-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Combined JSON
                    </button>
                  </div>

                  {/* Option 2: Bulk Zip files */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950">
                    <div>
                      <h3 className="text-xs font-bold mb-1 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Individual Files</h3>
                      <h4 className="text-sm font-semibold mb-2 text-zinc-800 dark:text-zinc-200">ZIP Archive Package</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-1">
                        Saves each row as its own JSON-LD file packed inside a compressed ZIP file. Select naming column below:
                      </p>

                      <select
                        value={zipNamingColumn}
                        onChange={(e) => setZipNamingColumn(e.target.value)}
                        className="w-full px-2 py-1 mb-4 text-[10px] rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      >
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>Filename: {h}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={downloadBulkZip}
                      disabled={isExporting}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs transition-all duration-200 disabled:opacity-75"
                    >
                      {isExporting ? (
                        <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Export ZIP Archive
                    </button>
                  </div>

                  {/* Option 3: Enriched CSV */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950">
                    <div>
                      <h3 className="text-xs font-bold mb-1 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Enriched Import Sheet</h3>
                      <h4 className="text-sm font-semibold mb-2 text-zinc-800 dark:text-zinc-200">Enriched CSV File</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                        Appends the compiled JSON-LD schema blocks directly as a new column in your original CSV spreadsheet.
                      </p>
                    </div>

                    <button
                      onClick={downloadEnrichedCSV}
                      disabled={isExporting}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-zinc-850 hover:bg-zinc-850/80 active:bg-zinc-900 text-white font-medium text-xs transition-all duration-200 disabled:opacity-75"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Enriched CSV
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Embedded Copilot Sidebar Panel */}
      <CopilotSidebar
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        csvHeaders={csvHeaders}
        selectedSchema={selectedSchemaKey}
        mapping={mapping}
      />

      {/* Simulated Checkout Paid Gate Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-fade-in text-zinc-950 dark:text-zinc-50">
            
            {/* Close Button */}
            <button
              onClick={() => setShowUnlockModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 text-sm font-semibold p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
            >
              ✕
            </button>

            {checkoutState === 'selection' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" /> Unlock Bulk Processing
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Select a pass to lift limits and export all <span className="font-bold text-blue-600 dark:text-blue-400">{csvData.length}</span> records. Processing is performed locally inside your web browser for security.
                </p>

                <div className="space-y-3 pt-2">
                  {/* 5k limit pass */}
                  <button
                    onClick={() => {
                      setCheckoutTier('5k');
                      handleSimulateCheckout(5000);
                    }}
                    className="w-full flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Migration Token</h4>
                      <h5 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mt-0.5">Up to 5,000 Rows</h5>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-zinc-950 dark:text-zinc-50">$19</span>
                      <p className="text-[9px] text-zinc-500">One-time batch</p>
                    </div>
                  </button>

                  {/* 10k limit pass */}
                  <button
                    onClick={() => {
                      setCheckoutTier('10k');
                      handleSimulateCheckout(10000);
                    }}
                    className="w-full flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Migration Token</h4>
                      <h5 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mt-0.5">Up to 10,000 Rows</h5>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-zinc-950 dark:text-zinc-50">$30</span>
                      <p className="text-[9px] text-zinc-500">One-time batch</p>
                    </div>
                  </button>

                  {/* Agency Pass */}
                  <button
                    onClick={() => {
                      setCheckoutTier('agency');
                      handleSimulateCheckout(Infinity);
                    }}
                    className="w-full flex items-center justify-between p-4 border-2 border-blue-500 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500">Full Agency License</h4>
                      <h5 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mt-0.5">Unlimited Rows</h5>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">$499</span>
                      <p className="text-[9px] text-zinc-500">Billed annually</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {checkoutState === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Processing secure transaction...</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Verifying browser token signature</p>
              </div>
            )}

            {checkoutState === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-md font-bold text-zinc-850 dark:text-zinc-200">Unlock Successful!</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your row limit has been upgraded to <span className="font-bold text-emerald-600 dark:text-emerald-400">{checkoutTier === 'agency' ? 'Unlimited' : checkoutTier === '10k' ? '10,000' : '5,000'} rows</span>.
                </p>
                <button
                  onClick={() => setShowUnlockModal(false)}
                  className="w-full mt-4 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Return to Workspace
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
