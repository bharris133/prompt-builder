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

// --- Add this interface ---
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
  useEffect(() => { if (!isEditing) { setEditText(component.content); } }, [component.content, isEditing]);
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => { setEditText(event.target.value); };
  const handleEditClick = () => { setEditText(component.content); setIsEditing(true); };
  const handleSaveClick = () => { onContentSave(component.id, editText); setIsEditing(false); };
  const handleCancelClick = () => { setIsEditing(false); };
  const handleDelete = () => { if (window.confirm(`...`)) { onDelete(component.id); } }

// --- Apply typing HERE ---
const typeStyles: { [key: string]: ComponentStyle } = { // Add type annotation
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
    Role: { 
      bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800',
      button: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
      saveButton: 'bg-purple-500 hover:bg-purple-600 text-white',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
  },
  'Example Input': { 
      bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800',
      button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
      saveButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
  },
  'Example Output': { 
      bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800',
      button: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
      saveButton: 'bg-orange-500 hover:bg-orange-600 text-white',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
  },
  // --- End Full Definitions ---
  Default: { // Ensure Default also matches the interface
      bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800',
      button: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      saveButton: 'bg-gray-500 hover:bg-gray-600 text-white',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
      deleteButton: 'bg-red-100 hover:bg-red-200 text-red-700'
  }
};


  const styles = typeStyles[component.type] || typeStyles.Default;
  // --- End Internal Logic ---
  console.log(`[${component.id}] Type: ${component.type}, Styles selected:`, styles); 

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
         <div className="flex justify-between items-center mb-2">
            <strong className={`${styles.text} font-medium`}>{component.type}:</strong>
            <div className="flex space-x-2">
                {/* Keep original buttons, NO listeners here yet */}
                {isEditing ? ( /* Save/Cancel buttons */
                    <>
                       <button onClick={handleSaveClick} className={`${styles.saveButton} /* ... */`}>Save</button>
                       <button onClick={handleCancelClick} className={`${styles.cancelButton} /* ... */`}>Cancel</button>
                    </>
                ) : ( /* Edit/Delete buttons */
                    <>
                       <button onClick={handleEditClick} className={`${styles.button} /* ... */`}>Edit</button>
                       <button onClick={handleDelete} className={`${styles.deleteButton} /* ... */`}>×</button>
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
                      />
         ) : (
            <p className="text-gray-700 /* ... */">{component.content || <span className="text-gray-400 italic">Empty {component.type}</span>}</p>
         )}
      </div>
    </div>
  );
} // --- End of SortablePromptComponent ---


// --- Home Page ---
export default function HomePage() {
  const [components, setComponents] = useState<PromptComponentData[]>([]);
  const nextId = useRef<number>(0)

  // *** MODIFIED HERE: Initialize content with empty string ***
  const addComponent = (type: string) => {
    const newId = nextId.current; // Get the current ID
    nextId.current += 1; // Increment the counter for the next time

    const newComponent: PromptComponentData = {
      id: newId, 
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

    // --- Update handleDragEnd with more logging ---
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        
        // Log the raw IDs immediately
        console.log(`[handleDragEnd] Active ID: ${active.id}, Over ID: ${over?.id}`); // Use optional chaining for over.id

        if (over && active.id !== over.id) { 
            setComponents((currentItems) => {
                // Log the state *before* finding indices
                console.log('[handleDragEnd] Current items before move:', JSON.stringify(currentItems.map(item => item.id))); 

                const oldIndex = currentItems.findIndex((item) => item.id === active.id);
                const newIndex = currentItems.findIndex((item) => item.id === over.id);

                // Log the calculated indices
                console.log(`[handleDragEnd] Calculated Old Index: ${oldIndex}, New Index: ${newIndex}`);

                if (oldIndex === -1 || newIndex === -1) {
                    console.warn("[handleDragEnd] Failed to find indices. Aborting move.");
                    return currentItems; // Return original items if indices invalid
                }

                // If indices are valid, calculate the new array
                const newItems = arrayMove(currentItems, oldIndex, newIndex);
                
                // Log the state *after* move calculation
                console.log('[handleDragEnd] New items after move:', JSON.stringify(newItems.map(item => item.id))); 

                return newItems; // Return the newly ordered array to update state
            });
        } else {
            console.log("[handleDragEnd] Drag ended without a valid move (no 'over' or same ID).");
        }
    }, []); // Empty dependency array for now

  // --- Minimal Sensor Setup ---
  const sensors = useSensors(
    useSensor(PointerSensor) // Just use pointer sensor initially
  );

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
              {/* --- Add SortableContext Wrapper --- */}
              <SortableContext 
                  items={components.map(c => c.id)} // Pass array of IDs
                  strategy={verticalListSortingStrategy} // Use vertical strategy
              >
              {/* Inside SortableContext in HomePage */}
                {components.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">
                        Click buttons in the sidebar to add prompt components here.
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
     {/* --- Close DndContext Wrapper --- */}
  </DndContext>
  );
}
