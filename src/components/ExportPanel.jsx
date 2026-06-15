import React, { useState } from 'react';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { compileRow, compileDataset } from '../utils/compiler';
import { 
  Download, 
  FileJson, 
  FolderArchive, 
  FileSpreadsheet, 
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ExportPanel({
  csvData,
  mapping,
  selectedSchemaType,
  globalConfig,
  fileName,
}) {
  const [zipping, setZipping] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const hasData = csvData && csvData.length > 0;

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const downloadSingleJsonLD = () => {
    if (!hasData) return;
    try {
      const compiled = compileDataset(csvData, mapping, selectedSchemaType, globalConfig);
      const blob = new Blob([JSON.stringify(compiled, null, 2)], { type: 'application/ld+json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = fileName.replace(/\.[^/.]+$/, "");
      link.download = `${cleanName}_${selectedSchemaType.toLowerCase()}_graph.jsonld`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerSuccess('Successfully downloaded single JSON-LD file with @graph representation.');
    } catch (err) {
      console.error(err);
      alert('Failed to generate JSON-LD: ' + err.message);
    }
  };

  const downloadZipArchive = async () => {
    if (!hasData) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      
      csvData.forEach((row, index) => {
        const compiled = compileRow(row, mapping, selectedSchemaType, globalConfig);
        
        // Find a representative identifier for naming the file
        let identifier = row.name || row.title || row.headline || row.sku || row.mpn || row.id || `record-${index + 1}`;
        // Normalize identifier for use in filename
        let cleanIdentifier = String(identifier)
          .replace(/[^a-zA-Z0-9-_]/g, '_')
          .substring(0, 60);

        if (!cleanIdentifier || cleanIdentifier === '_') {
          cleanIdentifier = `row-${index + 1}`;
        }
        
        zip.file(`${cleanIdentifier}.jsonld`, JSON.stringify(compiled, null, 2));
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = fileName.replace(/\.[^/.]+$/, "");
      link.download = `${cleanName}_${selectedSchemaType.toLowerCase()}_individual.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerSuccess(`Successfully packaged and downloaded ZIP containing ${csvData.length} .jsonld files.`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate ZIP: ' + err.message);
    } finally {
      setZipping(false);
    }
  };

  const downloadEnrichedCSV = () => {
    if (!hasData) return;
    try {
      const enrichedData = csvData.map((row) => {
        const compiled = compileRow(row, mapping, selectedSchemaType, globalConfig);
        return {
          ...row,
          schema_json_ld: JSON.stringify(compiled),
        };
      });

      const csvContent = Papa.unparse(enrichedData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const cleanName = fileName.replace(/\.[^/.]+$/, "");
      link.download = `${cleanName}_enriched.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerSuccess('Successfully downloaded CSV enriched with schema_json_ld column.');
    } catch (err) {
      console.error(err);
      alert('Failed to generate enriched CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center space-x-2 border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {!hasData ? (
        <div className="flex items-start space-x-2.5 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/20 text-zinc-500 dark:text-zinc-400 text-xs">
          <AlertCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">Exports Disabled</p>
            <p className="mt-0.5">Please upload a CSV file and set up schema mappings to download compiled JSON-LD files.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Single JSON-LD */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-lg flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-2">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-md w-fit">
                <FileJson className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Single JSON-LD (@graph)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Combines all {csvData.length} records into one file using a schema graph representation. Ideal for bulk headers injecting.
              </p>
            </div>
            <button
              onClick={downloadSingleJsonLD}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-md transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .jsonld</span>
            </button>
          </div>

          {/* Card 2: ZIP of JSON-LDs */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-lg flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-2">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-md w-fit">
                <FolderArchive className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                ZIP Archive
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generates individual <code>.jsonld</code> files for each row, zipped into one folder. Named by name/SKU/title.
              </p>
            </div>
            <button
              onClick={downloadZipArchive}
              disabled={zipping}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {zipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ZIP</span>
                </>
              )}
            </button>
          </div>

          {/* Card 3: Enriched CSV */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-lg flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="space-y-2">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-md w-fit">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Enriched CSV
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Downloads the original CSV with a new <code>schema_json_ld</code> column appended containing the compiled objects.
              </p>
            </div>
            <button
              onClick={downloadEnrichedCSV}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-md transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
