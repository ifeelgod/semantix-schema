import React, { useMemo } from 'react';
import { SUPPORTED_SCHEMAS } from '../utils/schemaDefinitions';
import { fuzzyAutoMap } from '../utils/fuzzyMapper';
import { 
  Settings, 
  Map, 
  ArrowRight, 
  HelpCircle, 
  Sparkles, 
  Building,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function SchemaMapper({
  selectedSchemaType,
  onSchemaTypeChange,
  headers = [],
  mapping = {},
  onMappingChange,
  onBulkMappingChange,
  globalConfig = {
    enableGlobalBrand: false,
    brandId: '',
    brandName: '',
    brandUrl: '',
    brandLogo: '',
  },
  onGlobalConfigChange,
}) {
  const schemaDef = SUPPORTED_SCHEMAS[selectedSchemaType];

  // Group fields
  const groupedFields = useMemo(() => {
    if (!schemaDef) return { required: [], recommended: [], optional: [] };
    const required = [];
    const recommended = [];
    const optional = [];

    schemaDef.fields.forEach(field => {
      if (field.required) {
        required.push(field);
      } else if (field.recommended) {
        recommended.push(field);
      } else {
        optional.push(field);
      }
    });

    return { required, recommended, optional };
  }, [schemaDef]);

  const handleFieldMappingTypeChange = (path, type) => {
    if (type === 'unmapped') {
      onMappingChange(path, null);
    } else if (type === 'static') {
      onMappingChange(path, { type: 'static', value: '' });
    } else {
      // type is column
      onMappingChange(path, { type: 'column', value: type });
    }
  };

  const handleStaticValueChange = (path, val) => {
    onMappingChange(path, { type: 'static', value: val });
  };

  const handleAutoMap = () => {
    if (headers.length === 0 || !schemaDef) return;
    const newMapping = fuzzyAutoMap(headers, schemaDef.fields);
    onBulkMappingChange(newMapping);
  };

  const updateGlobalConfig = (key, val) => {
    onGlobalConfigChange({
      ...globalConfig,
      [key]: val,
    });
  };

  const renderFieldRow = (field) => {
    const fieldMap = mapping[field.path] || null;
    const isMapped = !!fieldMap;
    const mappingType = fieldMap ? fieldMap.type : 'unmapped';
    const isStatic = mappingType === 'static';

    // Determine current select value
    let selectValue = 'unmapped';
    if (fieldMap) {
      selectValue = fieldMap.type === 'static' ? '__static__' : fieldMap.value;
    }

    // Is global override active for this path?
    const isGlobalOverridden = globalConfig.enableGlobalBrand && 
      (field.path === 'brand/@id' || field.path === 'publisher/@id' || field.path === 'brand/name' || field.path === 'publisher/name');

    return (
      <div 
        key={field.path} 
        className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-150"
      >
        {/* Left Side: Field info */}
        <div className="flex-1 space-y-1 pr-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {field.path}
            </span>
            {isMapped ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : field.required ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : null}
            
            {isGlobalOverridden && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                Global Override
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">{field.label}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{field.description}</p>
          {field.example && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
              Example: {field.example}
            </p>
          )}
        </div>

        {/* Right Side: Map Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:w-80 shrink-0">
          <div className="relative flex-1">
            <select
              value={isGlobalOverridden ? '__global__' : selectValue}
              disabled={isGlobalOverridden}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'unmapped') {
                  handleFieldMappingTypeChange(field.path, 'unmapped');
                } else if (val === '__static__') {
                  handleFieldMappingTypeChange(field.path, 'static');
                } else {
                  handleFieldMappingTypeChange(field.path, val);
                }
              }}
              className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50"
            >
              {isGlobalOverridden ? (
                <option value="__global__">Linked to Global Settings</option>
              ) : (
                <>
                  <option value="unmapped">Select Source...</option>
                  <option value="__static__">Custom Static Value</option>
                  {headers.length > 0 && (
                    <optgroup label="CSV Columns">
                      {headers.map(h => (
                        <option key={h} value={h}>
                          Column: {h}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>
          </div>

          {/* Static value text box */}
          {isStatic && !isGlobalOverridden && (
            <input
              type="text"
              placeholder="Enter static text..."
              value={fieldMap.value}
              onChange={(e) => handleStaticValueChange(field.path, e.target.value)}
              className="flex-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          )}
        </div>
      </div>
    );
  };

  const renderFieldSection = (title, fields, badgeClass) => {
    if (fields.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded ${badgeClass}`}>
            {title}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            ({fields.length} {fields.length === 1 ? 'field' : 'fields'})
          </span>
        </div>
        <div className="space-y-2">
          {fields.map(renderFieldRow)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Schema Selector Card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-950 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            1. Select Schema.org Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Object.keys(SUPPORTED_SCHEMAS).map((key) => {
              const item = SUPPORTED_SCHEMAS[key];
              const isSelected = selectedSchemaType === key;
              return (
                <button
                  key={key}
                  onClick={() => onSchemaTypeChange(key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all duration-150 ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="text-xs font-semibold">{item.name}</span>
                </button>
              );
            })}
          </div>
          {schemaDef && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic">
              {schemaDef.description}
            </p>
          )}
        </div>

        {/* Action Bar */}
        {headers.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              CSV file active with {headers.length} headers.
            </div>
            <button
              onClick={handleAutoMap}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold rounded-md transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Map Headers</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Config Settings */}
      {(selectedSchemaType === 'Product' || selectedSchemaType === 'Article') && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <Building className="w-4 h-4 text-zinc-500" />
              <span>Global Brand / Publisher Settings</span>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={globalConfig.enableGlobalBrand}
                onChange={(e) => updateGlobalConfig('enableGlobalBrand', e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <span className="text-zinc-700 dark:text-zinc-300">Enable Linked Entity</span>
            </label>
          </div>
          {globalConfig.enableGlobalBrand && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-fade-in">
              <div className="space-y-1">
                <label className="text-zinc-500 dark:text-zinc-400">Global Local ID</label>
                <input
                  type="text"
                  placeholder="#brand"
                  value={globalConfig.brandId}
                  onChange={(e) => updateGlobalConfig('brandId', e.target.value)}
                  className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500 dark:text-zinc-400">Brand/Publisher Name</label>
                <input
                  type="text"
                  placeholder="My Brand"
                  value={globalConfig.brandName}
                  onChange={(e) => updateGlobalConfig('brandName', e.target.value)}
                  className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500 dark:text-zinc-400">Brand Website URL</label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={globalConfig.brandUrl}
                  onChange={(e) => updateGlobalConfig('brandUrl', e.target.value)}
                  className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500 dark:text-zinc-400">Brand Logo URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={globalConfig.brandLogo}
                  onChange={(e) => updateGlobalConfig('brandLogo', e.target.value)}
                  className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1.5 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Field Mapper Section */}
      {schemaDef ? (
        <div className="space-y-6">
          {renderFieldSection(
            'Required Fields',
            groupedFields.required,
            'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50'
          )}
          {renderFieldSection(
            'Recommended Fields',
            groupedFields.recommended,
            'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
          )}
          {renderFieldSection(
            'Optional Fields',
            groupedFields.optional,
            'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg">
          Please select a Schema.org type above to start mapping fields.
        </div>
      )}
    </div>
  );
}
