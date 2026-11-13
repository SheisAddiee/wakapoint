/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { WakaPointHeader } from './components/WakaPointHeader';
import { AddressIngestionConsole } from './components/AddressIngestionConsole';
import { SpatialResolutionPanel } from './components/SpatialResolutionPanel';
import { WAKAPOINT_PRESET_CASES } from './data/wakaPointCases';
import { resolveWakaPointAddress } from './utils/wakaPointParser';
import { WakaPointTestCase, CaseKey, ResolvedAddressResult } from './types/wakapoint';

export default function App() {
  // Initial default: Case A (Lokogoma, Abuja)
  const defaultCase = WAKAPOINT_PRESET_CASES[0];
  const [selectedCaseKey, setSelectedCaseKey] = useState<CaseKey | null>(defaultCase.caseKey);
  const [inputText, setInputText] = useState<string>(defaultCase.text);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Resolved result state
  const [result, setResult] = useState<ResolvedAddressResult>(() =>
    resolveWakaPointAddress(defaultCase.text)
  );

  // Instant Test Case Selector: immediately populates input and triggers realistic structured output
  const handleSelectCase = (testCase: WakaPointTestCase) => {
    setSelectedCaseKey(testCase.caseKey);
    setInputText(testCase.text);
    // Instantly resolve without requiring external backend
    const resolved = resolveWakaPointAddress(testCase.text);
    setResult(resolved);
  };

  // Run Resolve & Extract Entities button handler with sleek animation
  const handleResolve = useCallback(() => {
    if (!inputText.trim()) return;
    setIsLoading(true);

    setTimeout(() => {
      const resolved = resolveWakaPointAddress(inputText);
      setResult(resolved);
      setIsLoading(false);
    }, 180);
  }, [inputText]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header */}
      <WakaPointHeader />

      {/* Main Two-Column Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Subtle sub-header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>WakaPoint Geo-NER Workstation</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated spatial decomposition of informal Nigerian & West African logistics addresses
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Region: Nigeria (NG-GIS)</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold">Active Pipeline</span>
          </div>
        </div>

        {/* Two Equal Columns (grid-cols-1 lg:grid-cols-2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Column 1: Address Ingestion Console */}
          <div className="w-full">
            <AddressIngestionConsole
              inputText={inputText}
              setInputText={(text) => {
                setInputText(text);
                // Clear active pill preset if user changes text
                if (selectedCaseKey && text !== WAKAPOINT_PRESET_CASES.find(c => c.caseKey === selectedCaseKey)?.text) {
                  setSelectedCaseKey(null);
                }
              }}
              selectedCaseKey={selectedCaseKey}
              onSelectCase={handleSelectCase}
              onResolve={handleResolve}
              isLoading={isLoading}
            />
          </div>

          {/* Column 2: Spatial Entity Extraction & Resolution */}
          <div className="w-full">
            <SpatialResolutionPanel
              result={result}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
