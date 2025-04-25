// src/app/components/VariableInputs.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState } from 'react';
import { usePrompt } from '../hooks/usePrompt';

const CollapseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>;
const ExpandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>;

export function VariableInputs() {
    const { detectedVariables, variableValues, updateVariableValue } = usePrompt();
    const [isOpen, setIsOpen] = useState(false); // Default CLOSED
    const toggleOpen = () => setIsOpen(!isOpen);

    if (detectedVariables.length === 0) {
        return null;
    }

    return (
        <section className="p-6 pt-4 flex-shrink-0">
            {/* Header Row */}
            <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-gray-800"> Variables ({detectedVariables.length})</h2> {/* Added count */}
                     <button onClick={toggleOpen} title={isOpen ? 'Collapse' : 'Expand'} className="text-gray-400 hover:text-gray-600 p-1">
                         {isOpen ? <CollapseIcon /> : <ExpandIcon />}
                     </button>
                </div>
                 <div></div>
            </div>

             {/* Collapsible Content Area Wrapper */}
             <div className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${ isOpen ? 'max-h-[500px] mt-1' : 'max-h-0' }`}>
                  {/* *** ADD max-h and overflow-y-auto to inner div *** */}
                  <div className={`bg-white p-4 rounded shadow-sm border border-gray-200 space-y-3 mb-1 max-h-[450px] overflow-y-auto`}>
                    {detectedVariables.map((varName) => (
                        <div key={varName}>
                            <label htmlFor={`variable-input-${varName}`} className="block text-sm font-medium text-gray-700 mb-1" >
                                {varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </label>
                            <input
                                type="text" id={`variable-input-${varName}`}
                                value={variableValues[varName] || ''}
                                onChange={(e) => updateVariableValue(varName, e.target.value)}
                                placeholder={`Enter value for {{${varName}}}...`}
                                className="w-full p-2 border border-gray-300 rounded shadow-sm text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    ))}
                    <p className="text-xs text-gray-500 pt-1 sticky bottom-0 bg-white pb-1"> {/* Made helper sticky */}
                        Values entered here replace <code>{`{{placeholders}}`}</code> in the generated prompt.
                    </p>
                </div>
            </div>
        </section>
    );
}