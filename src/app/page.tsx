'use client'; 

import React, { useState, ChangeEvent, useEffect } from 'react';

// --- Types remain the same ---
interface PromptComponentData {
  id: number; 
  type: string; 
  content: string;
}

interface PromptComponentProps {
  component: PromptComponentData;
  onContentSave: (id: number, newContent: string) => void;
  onDelete: (id: number) => void; 
}


// --- Prompt Component (Refined Logic) ---
function PromptComponent({ component, onContentSave, onDelete }: PromptComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  // IMPORTANT: Initialize editText based on component.content BUT update it carefully
  const [editText, setEditText] = useState(component.content); 

  // Sync local editText state ONLY if the component prop changes *while not editing*
  // This prevents external changes from overwriting user's typing during edit.
  useEffect(() => {
    if (!isEditing) {
      setEditText(component.content);
    }
  }, [component.content, isEditing]); // Re-run if component.content OR isEditing changes

  // Update local temporary state on textarea change
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(event.target.value); // Directly update based on input event
  };

  // Enter Edit Mode
  const handleEditClick = () => {
    // Ensure editText is synced with the latest content BEFORE editing starts
    setEditText(component.content); 
    setIsEditing(true);
  };

  // Save Changes
  const handleSaveClick = () => {
    onContentSave(component.id, editText); // Pass the current local editText state up
    setIsEditing(false); 
    // No need to manually setEditText here, useEffect will sync if needed later
  };

  // Cancel Edit
  const handleCancelClick = () => {
    setIsEditing(false);
    // Resetting editText is handled by the useEffect when isEditing becomes false
    // OR explicitly: setEditText(component.content); 
  };

  // Handle Delete
  const handleDelete = () => {
      if (window.confirm(`Are you sure you want to delete this ${component.type} component?`)) {
          onDelete(component.id);
      }
  }

  // --- Styling (remains the same) ---
  const typeStyles = { /* ... styles dictionary ... */ 
       // KEEP THE STYLES FROM THE PREVIOUS VERSION
        Instruction: {
            bg: 'bg-blue-50', 
            border: 'border-blue-200', 
            text: 'text-blue-800',
            button: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
            saveButton: 'bg-blue-500 hover:bg-blue-600 text-white',
            cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
        },
        Context: {
            bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800',
            button: 'bg-green-100 hover:bg-green-200 text-green-700',
            saveButton: 'bg-green-500 hover:bg-green-600 text-white',
            cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
        },
        Default: { 
            bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800',
            button: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
            saveButton: 'bg-gray-500 hover:bg-gray-600 text-white',
            cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
        }
  };
  const styles = typeStyles[component.type as keyof typeof typeStyles] || typeStyles.Default;

  return (
    <div className={`${styles.bg} ${styles.border} border p-3 rounded mb-3 shadow-sm`}>
      {/* Header Row with Title and Buttons */}
      <div className="flex justify-between items-center mb-2">
        <strong className={`${styles.text} font-medium`}>{component.type}:</strong>
        <div className="flex space-x-2">
          {isEditing ? (
            // --- Edit Mode Buttons ---
            <>
              <button
                onClick={handleSaveClick} // Use specific save handler
                className={`${styles.saveButton} text-xs font-bold py-1 px-3 rounded transition duration-150 ease-in-out`}
              >
                Save
              </button>
              <button
                onClick={handleCancelClick} // Use specific cancel handler
                className={`${styles.cancelButton} text-xs font-medium py-1 px-3 rounded transition duration-150 ease-in-out`}
              >
                Cancel
              </button>
            </>
          ) : (
            // --- View Mode Buttons ---
            <>
              <button
                onClick={handleEditClick} // Use specific edit handler
                className={`${styles.button} text-xs font-medium py-1 px-2 rounded transition duration-150 ease-in-out`}
              >
                Edit
              </button>
              <button
                onClick={handleDelete} 
                className={`${styles.deleteButton} text-xs font-medium py-1 px-2 rounded transition duration-150 ease-in-out`}
                title="Delete Component" 
              >
                × 
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area (Textarea or Paragraph) */}
      {isEditing ? (
        <textarea
          value={editText} // Textarea value is ALWAYS bound to the local editText state
          onChange={handleInputChange} // Updates local editText state
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] text-sm font-mono bg-white" 
          rows={Math.max(3, editText.split('\n').length)} 
          // DO NOT use placeholder attribute here
        />
      ) : (
        <p className="text-gray-700 mt-1 whitespace-pre-wrap text-sm"> 
          {component.content} {/* Display saved content from parent state */}
        </p>
      )}
    </div>
  );
}


// --- Home Page (No changes needed from the previous version) ---
export default function HomePage() {
  const [components, setComponents] = useState<PromptComponentData[]>([]);

  // Add a new component
  const addComponent = (type: string) => {
    const newComponent: PromptComponentData = {
      id: Date.now(), 
      type: type,
      content: `This is a new ${type} component. Edit me!`,
    };
    setComponents(prevComponents => [...prevComponents, newComponent]);
  };

  // Update the content of a specific component in the main state
  const handleContentSave = (id: number, newContent: string) => {
    setComponents(prevComponents =>
      prevComponents.map(comp =>
        comp.id === id ? { ...comp, content: newContent } : comp
      )
    );
  };
  
  // Delete a component from the main state
  const handleDeleteComponent = (id: number) => {
     console.log("Deleting component with ID:", id); 
     setComponents(prevComponents => prevComponents.filter(comp => comp.id !== id));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md z-10">
         {/* ... header content ... */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center h-16">
                 <h1 className="text-2xl font-semibold text-gray-900">
                   Prompt Engineering Builder
                 </h1>
                 <div></div> 
               </div>
             </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto flex-shrink-0">
           {/* ... sidebar content ... */}
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
             Add Components
           </h2>
           <button
              onClick={() => addComponent('Instruction')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out"
            >
              Add Instruction
            </button>
            <button
              onClick={() => addComponent('Context')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out"
            >
              Add Context
            </button>
        </aside>

        {/* Main Panel */}
        <section className="flex-1 p-6 overflow-y-auto">
          {/* ... main panel content ... */}
           <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Prompt Canvas
          </h2>
          <div className="bg-white p-4 rounded shadow min-h-[300px]">
            {components.length === 0 ? (
              <p className="text-gray-500 text-center py-10">
                Click buttons in the sidebar to add prompt components here.
              </p>
            ) : (
              components.map(component => (
                <PromptComponent
                  key={component.id}
                  component={component}
                  onContentSave={handleContentSave} 
                  onDelete={handleDeleteComponent}    
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}