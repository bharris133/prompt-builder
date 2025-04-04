'use client'; 

import React, { useState, ChangeEvent, useEffect } from 'react';

// --- Types ---
interface PromptComponentData {
  id: number; 
  type: string; 
  content: string; // Will be initialized as empty string ""
}

interface PromptComponentProps {
  component: PromptComponentData;
  onContentSave: (id: number, newContent: string) => void;
  onDelete: (id: number) => void; 
}


// --- Prompt Component (Manages its own edit state) ---
function PromptComponent({ component, onContentSave, onDelete }: PromptComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(component.content); // Starts empty or with saved content

  // Sync local state if component prop changes externally (e.g., load) AND not currently editing
  useEffect(() => {
    if (!isEditing) {
      setEditText(component.content);
    }
  }, [component.content, isEditing]);

  // Update local temporary state on textarea change
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(event.target.value); 
  };

  // Enter Edit Mode
  const handleEditClick = () => {
    // Sync editText with the current content just before editing starts
    setEditText(component.content); 
    setIsEditing(true);
  };

  // Save Changes
  const handleSaveClick = () => {
    onContentSave(component.id, editText); 
    setIsEditing(false); 
  };

  // Cancel Edit
  const handleCancelClick = () => {
    setIsEditing(false);
    // Let useEffect handle resetting editText based on component.content
  };

  // Handle Delete
  const handleDelete = () => {
      if (window.confirm(`Are you sure you want to delete this ${component.type} component?`)) {
          onDelete(component.id);
      }
  }

  // --- Styling ---
  const typeStyles = {
      Instruction: {
          bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800',
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
            // --- NEW STYLES START ---
            Role: { 
              bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800',
              button: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
              saveButton: 'bg-purple-500 hover:bg-purple-600 text-white',
              cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
              deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
          },
          'Example Input': { // Use quotes for keys with spaces
              bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800',
              button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
              saveButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
              cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
              deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
          },
          'Example Output': { // Use quotes for keys with spaces
              bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800',
              button: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
              saveButton: 'bg-orange-500 hover:bg-orange-600 text-white',
              cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
              deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
          },
          // --- NEW STYLES END ---
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
            <>
              <button onClick={handleSaveClick} className={`${styles.saveButton} text-xs font-bold py-1 px-3 rounded transition duration-150 ease-in-out`}>Save</button>
              <button onClick={handleCancelClick} className={`${styles.cancelButton} text-xs font-medium py-1 px-3 rounded transition duration-150 ease-in-out`}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={handleEditClick} className={`${styles.button} text-xs font-medium py-1 px-2 rounded transition duration-150 ease-in-out`}>Edit</button>
              <button onClick={handleDelete} className={`${styles.deleteButton} text-xs font-medium py-1 px-2 rounded transition duration-150 ease-in-out`} title="Delete Component">×</button>
            </>
          )}
        </div>
      </div>

      {/* Content Area (Textarea or Paragraph) */}
      {isEditing ? (
        <textarea
          value={editText} // Bound to local state
          onChange={handleInputChange} // Updates local state
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] text-sm font-mono bg-white text-black" 
          rows={3} // Start with a fixed number of rows, resize-y allows manual adjust
          placeholder={`Enter ${component.type} content here...`} // Use placeholder for guidance
        />
      ) : (
        <p className="text-gray-700 mt-1 whitespace-pre-wrap text-sm min-h-[20px]"> {/* Added min-h to prevent collapse when empty */}
          {component.content || <span className="text-gray-400 italic">Empty {component.type}</span>} {/* Show placeholder text if content is empty */}
        </p>
      )}
    </div>
  );
}


// --- Home Page ---
export default function HomePage() {
  const [components, setComponents] = useState<PromptComponentData[]>([]);

  // *** MODIFIED HERE: Initialize content with empty string ***
  const addComponent = (type: string) => {
    const newComponent: PromptComponentData = {
      id: Date.now(), 
      type: type,
      content: "", // Initialize with empty content
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
     console.log("Deleting component with ID:", id); // Keep log for now
     setComponents(prevComponents => prevComponents.filter(comp => comp.id !== id));
  };
  
  // --- Calculate the generated prompt string ---
  const generatedPrompt = components
    .map(comp => `${comp.type}:\n${comp.content}`) // Prefix with type, add content
    .join('\n\n'); // Join components with a double newline for separation

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
           {/* ... sidebar content (buttons) ... */}
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

            {/* --- NEW BUTTONS START --- */}
            <button
              onClick={() => addComponent('Role')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out"
            >
              Add Role
            </button>
             <button
              onClick={() => addComponent('Example Input')} // Note the type string matches the style key
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out"
            >
              Add Example Input
            </button>
             <button
              onClick={() => addComponent('Example Output')} // Note the type string matches the style key
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out"
            >
              Add Example Output
            </button>
            {/* --- NEW BUTTONS END --- */}
        </aside>

        {/* Main Content Column (Canvas + Generated Prompt) */}
        {/* Added flex-col here to stack canvas and generated prompt vertically */}
        <div className="flex-1 flex flex-col overflow-hidden">


        {/* Main Panel  (Canvas) */}
        <section className="flex-1 p-6 overflow-y-auto"> {/* Adjusted flex behavior later if needed */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Prompt Canvas
            </h2>
            <div className="bg-white p-4 rounded shadow min-h-[200px]"> {/* Reduced min-h slightly */}

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
        {/* END OF CANVAS SECTION */}

        
          {/* --- NEW: Generated Prompt Section --- */}
          <section className="p-6 pt-0"> {/* pt-0 to reduce space above */}
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Generated Prompt
            </h2>
            <div className="bg-gray-800 text-white p-4 rounded shadow overflow-auto max-h-60"> {/* Dark background, limit height, allow scroll */}
              <pre className="text-sm whitespace-pre-wrap break-words"> {/* Ensure wrapping */}
                {generatedPrompt || <span className="text-gray-400 italic">No components added yet.</span>}
              </pre>
              {/* TODO: Add a "Copy to Clipboard" button later */}
            </div>
          </section>
          {/* --- END OF NEW SECTION --- */}

        </div> 
        {/* END OF Main Content Column */}


      </main>
    </div>
  );
}
