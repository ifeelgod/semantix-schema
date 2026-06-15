import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Trash2, AlertTriangle } from 'lucide-react';

export default function CSVUploader({ onUploadComplete, onClear, csvData, headers, fileName }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Invalid file format. Please upload a CSV (.csv) file.');
      return;
    }

    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          setError(`Parsing error: ${results.errors[0].message}`);
          return;
        }

        if (results.data.length === 0) {
          setError('The uploaded CSV file is empty.');
          return;
        }

        const detectedHeaders = results.meta.fields || Object.keys(results.data[0]);
        onUploadComplete({
          data: results.data,
          headers: detectedHeaders,
          fileName: file.name,
        });
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const previewRows = csvData ? csvData.slice(0, 3) : [];

  return (
    <div className="space-y-4">
      {!csvData ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors duration-200 text-center ${
            isDragging
              ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 text-zinc-600 dark:text-zinc-400">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Drag & drop your CSV file here, or <span className="underline text-zinc-600 dark:text-zinc-400">browse</span>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Supports standard comma-separated values (.csv)
          </p>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden animate-fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              <div className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{fileName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {csvData.length} {csvData.length === 1 ? 'row' : 'rows'} &bull; {headers.length} {headers.length === 1 ? 'column' : 'columns'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                onClear();
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
              title="Remove File"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20 text-center py-2 text-xs">
            <div className="border-r border-zinc-200 dark:border-zinc-800 py-1">
              <span className="text-zinc-500 dark:text-zinc-400">Total Rows:</span>{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{csvData.length}</strong>
            </div>
            <div className="py-1">
              <span className="text-zinc-500 dark:text-zinc-400">Headers:</span>{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{headers.length}</strong>
            </div>
          </div>

          {/* Preview Table */}
          <div className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Previewing first 3 rows
            </h4>
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-md">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs font-mono">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-medium border-b border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300">
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      {headers.map((h, colIndex) => (
                        <td key={colIndex} className="px-3 py-2 max-w-[200px] truncate whitespace-nowrap">
                          {row[h] !== undefined && row[h] !== null ? String(row[h]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
