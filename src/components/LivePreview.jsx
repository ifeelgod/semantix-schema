import React, { useMemo, useState } from 'react';
import { compileRow } from '../utils/compiler';
import { SUPPORTED_SCHEMAS } from '../utils/schemaDefinitions';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Sliders,
  List,
  Eye
} from 'lucide-react';

export default function LivePreview({
  csvData = null,
  mapping = {},
  selectedSchemaType,
  globalConfig,
  selectedRowIndex = 0,
  onSelectedRowIndexChange,
}) {
  const [copied, setCopied] = useState(false);
  const schemaDef = SUPPORTED_SCHEMAS[selectedSchemaType];

  // Helper to extract nested value from object for validation checks
  const getNestedValue = (obj, path) => {
    if (!obj) return undefined;
    
    // FAQPage special handling
    if (obj['@type'] === 'FAQPage' && path.startsWith('faq_')) {
      const match = path.match(/faq_(\d+)\/(question|answer)/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        const type = match[2];
        const faqItem = obj.mainEntity?.[idx];
        if (!faqItem) return undefined;
        return type === 'question' ? faqItem.name : faqItem.acceptedAnswer?.text;
      }
    }

    const parts = path.split('/');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      
      if (typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Special validation check bypasses for post-compiled structures in compiler.js
        if (part === 'value' && current.value && typeof current.value === 'object' && 'value' in current.value) {
          current = current.value.value;
        } else if (part === 'url' && current.url) {
          current = current.url;
        } else {
          return undefined;
        }
      }
    }
    return current;
  };

  const hasValueAtPath = (obj, path) => {
    const val = getNestedValue(obj, path);
    return val !== undefined && val !== null && val !== '';
  };

  // Compute preview record and JSON-LD
  const { compiledJson, isMock } = useMemo(() => {
    if (!schemaDef) return { compiledJson: null, isMock: false };

    // Case 1: No CSV data - create a mock row using example values
    if (!csvData || csvData.length === 0) {
      const mockRow = {};
      const mockMapping = {};
      
      schemaDef.fields.forEach(field => {
        // Create an example field in mockRow
        mockRow[field.path] = field.example || '';
        mockMapping[field.path] = { type: 'column', value: field.path };
      });

      const compiled = compileRow(mockRow, mockMapping, selectedSchemaType, globalConfig);
      return { compiledJson: compiled, isMock: true };
    }

    // Case 2: Standard compilation with actual row data
    const row = csvData[selectedRowIndex];
    if (!row) return { compiledJson: null, isMock: false };

    const compiled = compileRow(row, mapping, selectedSchemaType, globalConfig);
    return { compiledJson: compiled, isMock: false };
  }, [csvData, mapping, selectedSchemaType, globalConfig, selectedRowIndex, schemaDef]);

  // Compute validation results
  const validationResults = useMemo(() => {
    if (!schemaDef || !compiledJson) return { isValid: false, errors: [], warnings: [], optionalMissing: [] };

    const errors = [];
    const warnings = [];
    const optionalMissing = [];

    schemaDef.fields.forEach(field => {
      const isPresent = hasValueAtPath(compiledJson, field.path);
      
      if (field.required && !isPresent) {
        errors.push(field);
      } else if (field.recommended && !isPresent) {
        warnings.push(field);
      } else if (!isPresent) {
        optionalMissing.push(field);
      }
    });

    const isValid = errors.length === 0;

    return { isValid, errors, warnings, optionalMissing };
  }, [schemaDef, compiledJson]);

  const jsonString = useMemo(() => {
    if (!compiledJson) return '';
    return JSON.stringify(compiledJson, null, 2);
  }, [compiledJson]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!schemaDef) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
      
      {/* Left Column: Row Navigation & Validation */}
      <div className="border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Header & Row Navigator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-zinc-500" />
                <span>Live Preview & Validation</span>
              </h3>
              
              {isMock ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  Previewing Demo Data
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  Live Data Active
                </span>
              )}
            </div>

            {/* Row Selector controls */}
            {csvData && csvData.length > 0 && (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
                    Record Selector:
                  </span>
                  <select
                    value={selectedRowIndex}
                    onChange={(e) => onSelectedRowIndexChange(Number(e.target.value))}
                    className="text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none max-w-xs truncate"
                  >
                    {csvData.map((row, idx) => {
                      // Get a summary name (e.g. name, title, headline or just index)
                      const label = row.name || row.title || row.headline || row.item_name || `Record ${idx + 1}`;
                      return (
                        <option key={idx} value={idx}>
                          #{idx + 1}: {String(label).substring(0, 30)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">1</span>
                  <input
                    type="range"
                    min="0"
                    max={csvData.length - 1}
                    value={selectedRowIndex}
                    onChange={(e) => onSelectedRowIndexChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    {csvData.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Validation Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Google Rich Snippet Validator
              </span>
              <div className="flex items-center">
                {validationResults.errors.length > 0 ? (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/30">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{validationResults.errors.length} Critical Errors</span>
                  </span>
                ) : validationResults.warnings.length > 0 ? (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{validationResults.warnings.length} Warnings</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/30">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>100% Valid</span>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {/* Errors (Required) */}
              {schemaDef.fields.filter(f => f.required).map(field => {
                const isPresent = hasValueAtPath(compiledJson, field.path);
                return (
                  <div key={field.path} className="flex items-start justify-between text-xs p-2 rounded border border-zinc-100 dark:border-zinc-900">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{field.label}</span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">({field.path})</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{field.description}</p>
                    </div>
                    <div className="shrink-0 pl-2">
                      {isPresent ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span>Mapped</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                          <XCircle className="w-4 h-4" />
                          <span>Required</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Warnings (Recommended) */}
              {schemaDef.fields.filter(f => f.recommended).map(field => {
                const isPresent = hasValueAtPath(compiledJson, field.path);
                return (
                  <div key={field.path} className="flex items-start justify-between text-xs p-2 rounded border border-zinc-100 dark:border-zinc-900">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{field.label}</span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">({field.path})</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{field.description}</p>
                    </div>
                    <div className="shrink-0 pl-2">
                      {isPresent ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span>Mapped</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Missing</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Display schema validation disclaimer */}
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 pt-3 mt-4">
          Google Search Console requires all &quot;Required&quot; fields to be mapped to generate rich results. Leaving out &quot;Recommended&quot; fields may trigger search performance warnings but will still qualify you for snippets.
        </div>
      </div>

      {/* Right Column: Code Editor/Viewer */}
      <div className="flex flex-col bg-zinc-950 text-zinc-200 min-h-[400px]">
        {/* Code Toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-zinc-900/60 shrink-0">
          <span className="text-xs font-mono text-zinc-400">
            {selectedSchemaType.toLowerCase()}_schema.jsonld
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code display */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed select-text">
          <pre className="whitespace-pre-wrap break-all text-emerald-400">
            {jsonString}
          </pre>
        </div>
      </div>
      
    </div>
  );
}
