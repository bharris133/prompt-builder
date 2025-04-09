'use client'; 

// --- Import Statements ---
import React, { useState, ChangeEvent, useEffect, useCallback,  useRef } from 'react'; 
import { CSS } from '@dnd-kit/utilities'; // We might not use CSS immediately, but good to have

import {
  DndContext,
  DragEndEvent, // We'll use the type for our placeholder
  // Minimal sensors for now, can add Keyboard later
  PointerSensor, 
  useSensor,
  useSensors,
  closestCenter // Basic collision strategy
} from '@dnd-kit/core';


import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';

// --- Type Interfaces ---

interface ComponentStyle {
  bg: string;
  border: string;
  text: string;
  button: string;
  saveButton: string;
  cancelButton: string;
  deleteButton: string;
}

interface PromptComponentData {
  id: number; 
  type: string; 
  content: string; // Will be initialized as empty string ""
}

// --- Sortable Prompt Component (Minimal Setup) ---
interface SortablePromptComponentProps {
  component: PromptComponentData;
  onContentSave: (id: number, newContent: string) => void;
  onDelete: (id: number) => void; 
}

// --- Interface for Saved Prompts Structure ---
interface SavedPrompts {
  [promptName: string]: PromptComponentData[]; // Map name to array of components
}

function SortablePromptComponent({ component, onContentSave, onDelete }: SortablePromptComponentProps) {
  const {
     attributes, 
     listeners,  
    setNodeRef, // NEED this to register the element
     transform,  
     transition, 
     isDragging  
  } = useSortable({ id: component.id }); // Pass the unique ID

  
  // --- DEFINE AND APPLY STYLE ---
  const style = {
    // Apply transform and transition for smooth dragging animation
    transform: CSS.Transform.toString(transform), // Use CSS utility
    transition, // Apply transition
     // Add opacity effect when dragging (optional visual feedback)
    opacity: isDragging ? 0.5 : 1,
    // Add z-index when dragging to ensure it appears above others
    zIndex: isDragging ? 10 : 'auto', 
  };
  // --- END STYLE DEFINITION ---

  // --- Internal Logic (Copy/Paste from original PromptComponent) ---
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(component.content); 
  // Reset editText if component content changes externally OR when cancelling edit
  useEffect(() => { if (!isEditing) { setEditText(component.content); } }, [component.content, isEditing]);
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => { setEditText(event.target.value); };
  const handleEditClick = () => { setEditText(component.content); setIsEditing(true); }; // Load current content on edit start
  const handleSaveClick = () => { onContentSave(component.id, editText); setIsEditing(false); };
  const handleCancelClick = () => { setIsEditing(false);  /* editText automatically resets via useEffect */ };
  const handleDelete = () => { if (window.confirm(`Are you sure you want to delete this "${component.type}" component?`)) { onDelete(component.id); } }

// --- Apply typing HERE ---
const typeStyles: { [key: string]: ComponentStyle } = { // Add type annotation
  Instruction: { 
      bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800',
      button: 'bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded text-x',
      saveButton: 'bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs'
  },
  Context: { 
      bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800',
      button: 'bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded text-xs',
      saveButton: 'bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs'
  },
    Role: { 
      bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800',
      button: 'bg-purple-100 hover:bg-purple-200 text-purple-700 py-1 px-2 rounded text-xs',
      saveButton: 'bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded text-xs',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs'
  },
  'Example Input': { 
      bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800',
      button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs',
      saveButton: 'bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-xs',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs'
  },
  'Example Output': { 
      bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800',
      button: 'bg-orange-100 hover:bg-orange-200 text-orange-700 py-1 px-2 rounded text-xs',
      saveButton: 'bg-orange-500 hover:bg-orange-600 text-white py-1 px-2 rounded text-xs',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs'
  },
      // --- NEW: Add Tools Style ---
  Tools: {
      bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800',
      button: 'bg-teal-100 hover:bg-teal-200 text-teal-700 py-1 px-2 rounded text-xs',
      saveButton: 'bg-teal-500 hover:bg-teal-600 text-white py-1 px-2 rounded text-xs',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs'
  },
        // --- End Tools Style ---
  // --- End Full Definitions ---
  Default: { // Ensure Default also matches the interface
      bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800',
      button: 'bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs',
      saveButton: 'bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs'
  }
};


  const styles = typeStyles[component.type] || typeStyles.Default;
  // --- End Internal Logic ---
  //console.log(`[${component.id}] Type: ${component.type}, Styles selected:`, styles); //optional: keep for debugging if needed

  return (
    // Apply setNodeRef to the outermost div of the component
    <div ref={setNodeRef}  style={style}  {...attributes}  > 
      {/* The rest of the component's JSX structure remains exactly the same as PromptComponent */}
      <div className={`${styles.bg} ${styles.border} border p-3 rounded mb-3 shadow-sm relative`}> 

           {/* --- DRAG HANDLE CODE BLOCK --- */}
           <div 
              {...listeners} // Apply listeners ONLY to the handle
              className="absolute top-2 right-14 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 z-20" 
              title="Drag to reorder"
            >
              {/* SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75V16.25a.75.75 0 0 1-1.5 0V3.75A.75.75 0 0 1 10 3ZM5.75 5.75a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM5 10a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 5 10Zm.75 3.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" clipRule="evenodd" />
              </svg>
           </div>
           {/* --- END DRAG HANDLE CODE BLOCK --- */}

         {/* Header Row */}
         <div className="flex justify-between items-center mb-2 pr-20">
            <strong className={`${styles.text} font-medium`}>{component.type}:</strong>
            <div className="flex space-x-1">
                {/* Keep original buttons, NO listeners here yet */}
                {isEditing ? ( /* Save/Cancel buttons */
                    <>
                       <button onClick={handleSaveClick} className={`${styles.saveButton} /* ... */`}>Save</button>
                       <button onClick={handleCancelClick} className={`${styles.cancelButton} /* ... */`}>Cancel</button>
                    </>
                ) : ( /* Edit/Delete buttons */
                    <>
                       <button onClick={handleEditClick} className={`${styles.button} /* ... */`}>Edit</button>
                       <button onClick={handleDelete} className={`${styles.deleteButton} /* ... */ml-1`}>×</button>
                    </>
                )}
            </div>
         </div>
         {/* Content Area */}
         {isEditing ? (
                        <textarea 
                        value={editText} 
                        onChange={handleInputChange} 
                        // Add the full className, rows, and placeholder back
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] text-sm font-mono bg-white text-gray-900" 
                        rows={3} 
                        placeholder={`Enter ${component.type} content here...`} 
                        autoFocus // Automatically focus on the textarea when editing starts
                      />
         ) : (
            <p className="text-gray-700 text-sm whitespace-pre-wrap break-words min-h-[24px]"> {/* Ensure wrapping, add min-height */}
                                        {component.content || <span className="text-gray-400 italic">Empty {component.type}</span>}</p>
         )}
      </div>
    </div>
  );
} // --- End of SortablePromptComponent ---


// --- Home Page ---
export default function HomePage() {

  // ** NEW: Define localStorage Key for Saved Prompts Map **
  const SAVED_PROMPTS_KEY = 'promptBuilderSavedPrompts';

   // State for the current components on the canvas
  const [components, setComponents] = useState<PromptComponentData[]>([]);

  // State for the name input field for saving
  const [promptName, setPromptName] = useState<string>("");

  // State to hold the names of saved prompts (for the dropdown later)
  const [savedPromptNames, setSavedPromptNames] = useState<string[]>([]);
  
  // ** NEW: State to track the value selected in the dropdown **
  const [selectedPromptToLoad, setSelectedPromptToLoad] = useState<string>(""); // Initialize as empty string

  // Ref for managing unique IDs for components added in the current session
  const nextId = useRef<number>(0)

    // --- Load Saved Prompt Names on Mount (for the dropdown later) ---
    useEffect(() => {
      if (typeof window !== 'undefined') {
          const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
          if (storedData) {
              try {
                  const savedPrompts: SavedPrompts = JSON.parse(storedData);
                  // Get the keys (names) from the saved prompts object
                  setSavedPromptNames(Object.keys(savedPrompts).sort()); // Sort the names for better UX
              } catch (e) {
                  console.error("Failed to parse saved prompts from localStorage", e);
                  localStorage.removeItem(SAVED_PROMPTS_KEY); // Clear corrupted data
              }
          }
      }
  }, []); // Empty dependency array: runs only once on mount

  // --- Recalculate nextId when components change (e.g., load, clear, add, delete) ---
  useEffect(() => {
    const maxId = components.length > 0
        ? Math.max(...components.map(c => c.id))
        : -1; // Find highest ID, or -1 if empty
    nextId.current = maxId + 1; // Set next ID to be one higher
    // console.log("Recalculated nextId.current to:", nextId.current); // Debug log
  }, [components]);


  // --- Function to clear the dropdown selection ---
  // This signifies that the canvas content no longer matches the selected loaded prompt
  const clearLoadSelection = useCallback(() => {
    // console.log("Clearing load selection"); // Debug log
    setSelectedPromptToLoad("");
  }, []); // No dependencies, it's a stable function reference

  // --- Component Manipulation Functions ---
  // *** Initialize content with empty string ***
  const addComponent = (type: string) => {
    const newId = nextId.current; // Get the current ID
    nextId.current += 1; // Increment the counter for the next time

    const newComponent: PromptComponentData = {
      id: newId, 
      type: type,
      content: "", // Initialize with empty content
    };
    setComponents(prevComponents => [...prevComponents, newComponent]);
    clearLoadSelection(); // Canvas changed
  };

  // Update the content of a specific component in the main state
  const handleContentSave = (id: number, newContent: string) => {
    setComponents(prevComponents =>
      prevComponents.map(comp =>
        comp.id === id ? { ...comp, content: newContent } : comp
      )
    );
    clearLoadSelection(); // Canvas changed
  };
  
  // Delete a component from the main state
  const handleDeleteComponent = (id: number) => {
    if (window.confirm(`Are you sure you want to delete this component from the canvas?`)) {
      setComponents(prevComponents => prevComponents.filter(comp => comp.id !== id));
      clearLoadSelection(); // Canvas changed
   }
  };

  
  // --- NEW: Function to Save the Current Prompt ---
  const handleSavePrompt = () => {
    const nameToSave = promptName.trim();
    if (!nameToSave) {
        alert("Please enter a name for the prompt before saving.");
        return;
    }
    if (components.length === 0) {
        alert("Cannot save an empty prompt.");
        return;
    }

    if (typeof window !== 'undefined') {
        // 1. Get existing saved prompts (or initialize if none)
        let savedPrompts: SavedPrompts = {};
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) {
            try {
                savedPrompts = JSON.parse(storedData);
                // Basic validation if needed: check if it's an object
                if (typeof savedPrompts !== 'object' || savedPrompts === null) { savedPrompts = {}; } } catch (e) { savedPrompts = {}; } }
        

        // 2. Check for overwrite
        const isOverwriting = savedPrompts[nameToSave]; // Check if name exists before asking
        if (isOverwriting && !window.confirm(`Prompt "${nameToSave}" already exists. Overwrite it?`)) {
          return; // User cancelled overwrite
      }
        

        // 3. Add or Update the current prompt components
        savedPrompts[nameToSave] = components;

        // 4. Save back to localStorage
        try {
            localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
            alert(`Prompt "${nameToSave}" saved successfully!`);

            // 5. Update the list of saved prompt names state (for the dropdown later)
            if (!savedPromptNames.includes(nameToSave)) {
                setSavedPromptNames(prevNames => [...prevNames, nameToSave].sort()); // Keep it sorted
            }
              // *** Crucial: Set the dropdown selection ONLY if saving EXACTLY what was loaded ***
              // OR if saving a new prompt (then selection should reflect the new save)
              // Check if current components exactly match what's just been saved under this name
              // (This comparison assumes order matters, which it does for us)
              if (JSON.stringify(savedPrompts[nameToSave]) === JSON.stringify(components)) {
                setSelectedPromptToLoad(nameToSave); // Sync dropdown to the saved state
             } else {
                // This case should theoretically not happen with current logic, but as a fallback:
                clearLoadSelection();
             }

        } catch (e) {
            console.error("Failed to save prompts", e);
            alert("Error saving prompt.");
        }
    }
};

  // --- Clear Current Canvas ---
  const handleClearCanvas = () => {
    if (components.length > 0 && window.confirm("Are you sure you want to clear the current canvas? Unsaved changes will be lost.")) {
        setComponents([]);
        setPromptName("");
        clearLoadSelection(); // Clear dropdown selection
    } else if (components.length === 0) {
         setPromptName("");
         clearLoadSelection(); // Clear dropdown selection
    }
}

// --- *** NEW: Load Selected Prompt *** ---
const handleLoadPrompt = (event: ChangeEvent<HTMLSelectElement>) => {
  const nameToLoad = event.target.value;

  // If trying to load the currently selected item again, do nothing.
  if (nameToLoad === selectedPromptToLoad && nameToLoad !== "") {
      return;
  }

  // If selecting the placeholder, clear the canvas (optional, or just reset selection)
  if (!nameToLoad) {
      // Option 1: Do nothing, just update selection state
      setSelectedPromptToLoad("");
      // Option 2: Clear canvas after confirmation (like handleClearCanvas)
      // if (components.length > 0 && window.confirm("Clear canvas?")) {
      //     setComponents([]);
      //     setPromptName("");
      // }
      // setSelectedPromptToLoad("");
      return;
  }


  // Confirm before overwriting canvas ONLY IF canvas has content OR a different prompt is selected
  // No need to confirm if canvas is empty or if loading the prompt matching the current name input
  const needsConfirmation = components.length > 0 && selectedPromptToLoad !== nameToLoad;

  if (needsConfirmation) {
      if (!window.confirm(`Loading "${nameToLoad}" will replace the current canvas content. Proceed?`)) {
          // User cancelled: Revert dropdown visual state to what it was before clicking
          // We don't need to find the name - just keep the previous selectedPromptToLoad value
          // event.target.value = selectedPromptToLoad; // This doesn't work directly on controlled components
          // Instead, React handles this: just don't update the state if cancelled.
           return;
      }
  }

  // Proceed with loading
  if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
      if (storedData) {
          try {
              const savedPrompts: SavedPrompts = JSON.parse(storedData);
              const componentsToLoad = savedPrompts[nameToLoad];

              if (componentsToLoad) {
                  setComponents(componentsToLoad); // Load components
                  setPromptName(nameToLoad);       // Set input field name
                  setSelectedPromptToLoad(nameToLoad); // Sync dropdown selection state
                  // REMOVED success alert: alert(`Prompt "${nameToLoad}" loaded!`);
                  console.log(`Prompt "${nameToLoad}" loaded.`); // Log instead of alert
              } else {
                  console.error(`Prompt "${nameToLoad}" not found.`);
                  alert(`Error: Could not find prompt "${nameToLoad}".`);
                  clearLoadSelection(); // Reset dropdown
                  // Maybe clear canvas too? Or leave as is? Let's leave it for now.
              }
          } catch (e) {
              console.error("Failed parsing on load", e); alert("Error loading prompt."); clearLoadSelection();
          }
      } else {
           alert("No saved prompts found."); clearLoadSelection();
      }
  }
};

  // --- END OF LOAD SELECTED PROMPT FUNCTION ---

  // --- *** NEW: Delete Saved Prompt *** ---
  const handleDeleteSavedPrompt = () => {
    const nameToDelete = selectedPromptToLoad;

    if (!nameToDelete) {
        alert("Please select a prompt from the dropdown to delete.");
        return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the saved prompt "${nameToDelete}"? This cannot be undone.`)) {
        if (typeof window !== 'undefined') {
            let savedPrompts: SavedPrompts = {};
            const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (storedData) { try { savedPrompts = JSON.parse(storedData); } catch (e) { /* Handle error */ savedPrompts = {}; } }

            if (savedPrompts[nameToDelete]) {
                // Delete the key from the object
                delete savedPrompts[nameToDelete];

                try {
                    // Save the modified object back
                    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));

                    // Update the dropdown list state
                    setSavedPromptNames(prevNames => prevNames.filter(name => name !== nameToDelete));

                    // Clear the selection in the dropdown
                    clearLoadSelection(); // Sets selectedPromptToLoad to ""

                    // If the deleted prompt is the one currently on the canvas, clear canvas
                    if (promptName === nameToDelete) {
                        setComponents([]);
                        setPromptName("");
                    }

                    alert(`Prompt "${nameToDelete}" deleted successfully.`);

                } catch (e) {
                    console.error("Failed to update localStorage after delete", e);
                    alert("Error deleting prompt from storage.");
                }
            } else {
                // This shouldn't happen if state is synced, but handle defensively
                alert(`Error: Prompt "${nameToDelete}" not found in storage.`);
                // Might need to refresh savedPromptNames state here if out of sync
                setSavedPromptNames(Object.keys(savedPrompts).sort());
                clearLoadSelection();
            }
        }
    }
};

  // --- END OF DELETE SAVED PROMPT FUNCTION ---
  
  // --- Calculate the generated prompt string ---
  const generatedPrompt = components
    .map(comp => `**${comp.type}:**\n${comp.content}`) // Prefix with type, add content
    .join('\n\n---\n\n'); // Join components with a double newline for separation

    // --- Update handleDragEnd with more logging ---
  // --- Drag and Drop Handler (Revised Logic) ---
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setComponents((currentItems) => {
            const oldIndex = currentItems.findIndex((item) => item.id === active.id);
            const newIndex = currentItems.findIndex((item) => item.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return currentItems;
            return arrayMove(currentItems, oldIndex, newIndex);
            // Note: State update will trigger nextId recalc via useEffect
        });
        clearLoadSelection(); // Clear dropdown selection as canvas changed
        // Keep promptName in the input field
    }
}, [clearLoadSelection]); // Add clearLoadSelection as dependency



  // --- Minimal Sensor Setup ---
  const sensors = useSensors(
    useSensor(PointerSensor) // Just use pointer sensor initially
  );

  // --- JSX Structure ---
  return (
        // --- Add DndContext Wrapper ---
  <DndContext 
      sensors={sensors} // Add sensors
      collisionDetection={closestCenter} // Add basic collision detection
      onDragEnd={handleDragEnd} // Use placeholder handler
    >
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md z-10">
          {/* ... header content ... */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16 space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900 flex-shrink-0">
                    Prompt Builder
                </h1>

                {/* Save Prompt Section */}
                <div className="flex items-center space-x-2 flex-grow min-w-0"> {/* Allow flex grow/shrink */}
                   <label htmlFor="promptNameInput" className="text-sm font-medium text-gray-700 flex-shrink-0">Prompt Name:</label>
                   <input
                      id="promptNameInput"
                      type="text"
                      value={promptName}
                      onChange={(e) => setPromptName(e.target.value)}
                      placeholder="Enter or load prompt name..."
                      className="flex-grow p-2 border border-gray-300 rounded shadow-sm text-sm min-w-[150px] text-gray-900" // Ensure min-width                      
                   />
                   <button
                      onClick={handleSavePrompt}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
                      disabled={components.length === 0 || !promptName} // Disable save if canvas is empty or name is empty
                      title={components.length === 0 ? "Add components before saving" : !promptName.trim() ? "Enter a name to save" : `Save prompt as "${promptName}"`}
                   >
                        Save Prompt
                   </button>
                </div>

                {/* Clear Canvas Button */}
                 <button
                    onClick={handleClearCanvas}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
                    disabled={components.length === 0 && !promptName} // Disable if canvas and name are empty
                    title="Clear the current canvas"
                >
                    Clear Canvas
                </button>
              </div>
          </div>
        </header>


        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto flex-shrink-0">

              {/* --- Load/Delete Section --- */}
              <div className="mb-6 space-y-2"> {/* Added space-y for button */}
                 <label htmlFor="loadPromptSelect" className="block text-lg font-semibold text-gray-700 mb-2">
                    Load Prompt
                 </label>
                 <select
                    id="loadPromptSelect"
                    value={selectedPromptToLoad} // Bind value to state
                    onChange={handleLoadPrompt}   // Attach the handler
                    className="w-full p-2 border border-gray-300 rounded bg-white shadow-sm text-sm text-gray-900"
                    disabled={savedPromptNames.length === 0} // Disable if no saved prompts
                 >
                    <option value="">{savedPromptNames.length === 0 ? "No saved prompts" : "-- Select a prompt --"}</option>
                    {/* We will map savedPromptNames here in the next step */}
                     {savedPromptNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                 </select>
                  {/* --- NEW Delete Button --- */}
                  <button
                    onClick={handleDeleteSavedPrompt}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPromptToLoad} // Disable if no prompt is selected in dropdown
                    title={selectedPromptToLoad ? `Delete the selected prompt "${selectedPromptToLoad}"` : "Select a prompt to delete"}
                 >
                    Delete Selected Prompt
                 </button>
                 {/* --- End Delete Button --- */}
              </div>

            {/* ... Add Components Section ... */}
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Add Components
              </h2>
              {/* Use wrapper functions to clear selection on add */}
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
              {/* --- Tools Button --- */}
              <button
                    onClick={() => addComponent('Tools')} // Add this later
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out" 
                >
                    Add Tools
                </button>
              {/* --- Tools BUTTONS END --- */}
          </aside>

          {/* Main Content Column */}
          {/* Added flex-col here to stack canvas and generated prompt vertically */}
          <div className="flex-1 flex flex-col overflow-hidden">


          {/* Main Panel  (Canvas) */}
          <section className="flex-1 p-6 overflow-y-auto"> {/* Adjusted flex behavior later if needed */}
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Prompt Canvas
                {promptName && <span className="text-base font-normal text-gray-500">-({selectedPromptToLoad === promptName ? 'Loaded' : 'Editing'}): {promptName} </span>} {/* Show current name if loaded/set */}
              </h2> 
              <div className="bg-white p-4 rounded shadow min-h-[200px]"> {/* Reduced min-h slightly */}
              {/* --- Add SortableContext Wrapper --- */}
              <SortableContext 
                  items={components.map(c => c.id)} // Pass array of IDs
                  strategy={verticalListSortingStrategy} // Use vertical strategy
              >
              {/* Inside SortableContext in HomePage */}
                {components.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">
                        Add components using the sidebar buttons, or load a saved prompt.
                    </p>
                ) : (
                    // *** Change this line ***
                    components.map(component => (
                    <SortablePromptComponent // Use the new wrapper component
                        key={component.id}
                        component={component}
                        onContentSave={handleContentSave}
                        onDelete={handleDeleteComponent}
                    />
                    ))
                )}  
              {/* --- Close SortableContext Wrapper --- */}
              </SortableContext>
            </div>
          </section>
          {/* END OF CANVAS SECTION */}

          
          {/* --- NEW: Generated Prompt Section --- */}
          <section className="p-6 pt-0"> {/* pt-0 to reduce space above */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Generated Prompt
              </h2>

              <button
                  onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!generatedPrompt.trim()}
                  title="Copy prompt to clipboard"
              >
                  Copy
              </button>
            </div>

              <div className="bg-gray-800 text-white p-4 rounded shadow overflow-auto max-h-60 relative group"> {/* Dark background, limit height, allow scroll */}
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
     {/* --- Close DndContext Wrapper --- */}
  </DndContext>
  );
}
