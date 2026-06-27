'use client';

import { useState, useCallback } from 'react';
import { useTeamBuilderStore } from '@/stores/team-builder.store';
import { importTeamFromTextAction } from '@/server/actions/showdown.actions';
import type { ParsedPokemon } from '@/server/services/showdown-import.service';

export function ShowdownExportImport() {
  const { members, teamName, applyImportedTeam } = useTeamBuilderStore();

  const [exportText, setExportText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedPokemon[] | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportText('');
    setCopySuccess(false);

    const filledMembers = members
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .map((m) => ({
        species: m.pokemonName,
        item: null as string | null,
        ability: m.abilityName,
        teraType: m.teraType ?? null,
        level: 50,
        isMega: m.isMega,
        statPoints: m.statPoints,
        nature: m.nature,
        moves: m.moves,
      }));

    if (filledMembers.length === 0) {
      setExportText('');
      setIsExporting(false);
      return;
    }

    const { exportTeamToText } = await import('@/server/services/showdown-export.service');
    const text = exportTeamToText({
      name: teamName || 'Untitled Team',
      members: filledMembers,
    });

    setExportText(text);
    setIsExporting(false);
  }, [members, teamName]);

  const handleCopy = useCallback(async () => {
    if (!exportText) return;
    try {
      await navigator.clipboard.writeText(exportText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = exportText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [exportText]);

  const handleParseImport = useCallback(async () => {
    if (!importText.trim()) {
      setImportError('Please paste Showdown text to import.');
      setParsedPreview(null);
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setParsedPreview(null);

    try {
      const result = await importTeamFromTextAction(importText);
      if (result.success && result.data) {
        setParsedPreview(result.data);
      } else {
        setImportError(result.error ?? 'Failed to parse import text.');
      }
    } catch {
      setImportError('An unexpected error occurred while parsing.');
    } finally {
      setIsImporting(false);
    }
  }, [importText]);

  const handleApplyImport = useCallback(() => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    applyImportedTeam(parsedPreview);
    setParsedPreview(null);
    setImportText('');
    setImportError(null);
  }, [parsedPreview, applyImportedTeam]);

  const handleClearImport = useCallback(() => {
    setImportText('');
    setImportError(null);
    setParsedPreview(null);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg">Export to Showdown</h2>
          <p className="text-sm text-base-content/60">
            Export your team to Pokemon Showdown text format for sharing.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              className={`btn btn-primary btn-sm ${isExporting ? 'loading' : ''}`}
              onClick={handleExport}
              disabled={isExporting}
              aria-label="Export team to Showdown format"
            >
              {isExporting ? 'Exporting...' : 'Export to Showdown'}
            </button>
          </div>
          {exportText && (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                className="textarea textarea-bordered w-full font-mono text-xs"
                rows={10}
                readOnly
                value={exportText}
                aria-label="Exported Showdown text"
              />
              <button
                className={`btn btn-sm ${copySuccess ? 'btn-success' : 'btn-outline'}`}
                onClick={handleCopy}
                aria-label="Copy exported text to clipboard"
              >
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg">Import from Showdown</h2>
          <p className="text-sm text-base-content/60">
            Paste Pokemon Showdown text format to import a team.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              className="textarea textarea-bordered w-full font-mono text-xs"
              rows={8}
              placeholder="Paste Showdown format here..."
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setParsedPreview(null);
                setImportError(null);
              }}
              aria-label="Showdown import text"
            />
            <div className="flex gap-2">
              <button
                className={`btn btn-primary btn-sm ${isImporting ? 'loading' : ''}`}
                onClick={handleParseImport}
                disabled={isImporting || !importText.trim()}
                aria-label="Parse import text"
              >
                {isImporting ? 'Parsing...' : 'Parse'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleClearImport}
                aria-label="Clear import text"
              >
                Clear
              </button>
            </div>
          </div>

          {importError && (
            <div className="alert alert-error mt-3" role="alert">
              <span className="text-sm">{importError}</span>
            </div>
          )}

          {parsedPreview && parsedPreview.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <h3 className="font-semibold text-sm">
                Parsed Preview ({parsedPreview.length} Pokemon)
              </h3>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Species</th>
                      <th>Ability</th>
                      <th>Nature</th>
                      <th>Tera</th>
                      <th>Mega</th>
                      <th>Moves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreview.map((p, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="capitalize">{p.species}</td>
                        <td className="capitalize">{p.ability}</td>
                        <td className="capitalize">{p.nature}</td>
                        <td className="capitalize">{p.teraType ?? '-'}</td>
                        <td>{p.isMega ? 'Yes' : '-'}</td>
                        <td>
                          <div className="flex gap-0.5 flex-wrap">
                            {p.moves.map((m, j) => (
                              <span key={j} className="badge badge-outline badge-xs capitalize">
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleApplyImport}
                  aria-label="Apply imported team"
                >
                  Apply to Team
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setParsedPreview(null)}
                  aria-label="Discard import preview"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
