/**
 * TaskPopover Usage Examples
 *
 * This file demonstrates how to use the refactored TaskPopover component
 * with all its different modes and configurations.
 */

import React, { useState } from 'react'
import TaskPopover from './TaskPopover'

const TaskPopoverExamples = () => {
  // Example state management
  const [createMode, setCreateMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [aiMode, setAiMode] = useState(false)

  const [selectedTask, setSelectedTask] = useState(null)
  const [clickCoords, setClickCoords] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const clientId = 'example-client-id'

  // Example handlers
  const handleCreateTask = async taskData => {
    console.log('Creating task:', taskData)
    // API call to create task
    // await api.createTask(taskData)
  }

  const handleUpdateTask = async taskData => {
    console.log('Updating task:', taskData)
    // API call to update task
    // await api.updateTask(taskData.id, taskData)
  }

  const handleDeleteTask = async task => {
    console.log('Deleting task:', task)
    // API call to delete task
    // await api.deleteTask(task.id)
  }

  // Example existing task data
  const sampleTask = {
    id: 'task-123',
    title: 'Publicación sobre fitness matutino',
    copy: 'Buenos días! 💪 Empieza tu día con energía. #FitnessMotivation #MorningWorkout',
    status: 'en-diseño',
    channel: 'IG',
    scheduled_at: '2025-09-08T09:00:00Z',
  }

  return (
    <div className='p-8 space-y-8 bg-gray-900 min-h-screen'>
      <h1 className='text-2xl font-bold text-white mb-8'>TaskPopover Usage Examples</h1>

      {/* Example 1: Create Mode (Default) */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold text-white'>1. Create Mode (Default)</h2>
        <p className='text-gray-400'>
          Used when clicking on empty calendar dates or "New Event" button
        </p>

        <div className='space-x-4'>
          <button
            onClick={e => {
              setClickCoords({ x: e.clientX, y: e.clientY })
              setCreateMode(true)
            }}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Open Create Task Popover
          </button>
        </div>

        <pre className='bg-gray-800 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto'>
          {`<TaskPopover
  isOpen={isCreateOpen}
  onClose={() => setIsCreateOpen(false)}
  mode="create"
  
  // Positioning
  clickCoords={clickCoords}
  selectedDate={new Date()}
  
  // Context
  clientId="client-123"
  
  // Actions
  onCreateTask={handleCreateTask}
/>`}
        </pre>
      </section>

      {/* Example 2: Edit Mode */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold text-white'>2. Edit Mode</h2>
        <p className='text-gray-400'>Used when clicking on existing tasks in the calendar</p>

        <div className='space-x-4'>
          <button
            onClick={e => {
              setClickCoords({ x: e.clientX, y: e.clientY })
              setSelectedTask(sampleTask)
              setEditMode(true)
            }}
            className='px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors'
          >
            Open Edit Task Popover
          </button>
        </div>

        <pre className='bg-gray-800 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto'>
          {`<TaskPopover
  isOpen={isEditOpen}
  onClose={() => setIsEditOpen(false)}
  mode="edit"
  
  // Positioning
  clickCoords={clickCoords}
  selectedDate={new Date(task.scheduled_at)}
  
  // Context
  clientId="client-123"
  existingTask={selectedTask}
  
  // Actions
  onUpdateTask={handleUpdateTask}
  onDeleteTask={handleDeleteTask}
/>`}
        </pre>
      </section>

      {/* Example 3: AI Generate Mode */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold text-white'>3. AI Generate Mode</h2>
        <p className='text-gray-400'>Used when generating tasks with AI suggestions or prompts</p>

        <div className='space-x-4'>
          <button
            onClick={e => {
              setClickCoords({ x: e.clientX, y: e.clientY })
              setAiMode(true)
            }}
            className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
          >
            Open AI Generate Popover
          </button>
        </div>

        <pre className='bg-gray-800 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto'>
          {`<TaskPopover
  isOpen={isAiOpen}
  onClose={() => setIsAiOpen(false)}
  mode="ai-generate"
  
  // Positioning
  clickCoords={clickCoords}
  selectedDate={new Date()}
  
  // Context
  clientId="client-123"
  
  // AI
  aiPrompt="Crear posts para campaña de verano"
  
  // Actions
  onCreateTask={handleCreateTask}
/>`}
        </pre>
      </section>

      {/* Key Features */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold text-white'>Key Features</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='bg-gray-800 p-4 rounded-lg'>
            <h3 className='font-semibold text-white mb-2'>✨ Responsive Design</h3>
            <p className='text-gray-400 text-sm'>
              Automatically adapts to mobile, tablet, and desktop with different layouts and
              animations
            </p>
          </div>

          <div className='bg-gray-800 p-4 rounded-lg'>
            <h3 className='font-semibold text-white mb-2'>💾 Draft System</h3>
            <p className='text-gray-400 text-sm'>
              Auto-saves drafts in create mode with visual indicators and cleanup
            </p>
          </div>

          <div className='bg-gray-800 p-4 rounded-lg'>
            <h3 className='font-semibold text-white mb-2'>🎯 Smart Positioning</h3>
            <p className='text-gray-400 text-sm'>
              Dynamic positioning on desktop to avoid viewport edges
            </p>
          </div>

          <div className='bg-gray-800 p-4 rounded-lg'>
            <h3 className='font-semibold text-white mb-2'>🤖 AI Integration</h3>
            <p className='text-gray-400 text-sm'>
              Built-in AI suggestions and prompts for create and ai-generate modes
            </p>
          </div>

          <div className='bg-gray-800 p-4 rounded-lg'>
            <h3 className='font-semibold text-white mb-2'>🎨 Mode-Based UI</h3>
            <p className='text-gray-400 text-sm'>
              Dynamic titles, icons, and button text based on current mode
            </p>
          </div>

          <div className='bg-gray-800 p-4 rounded-lg'>
            <h3 className='font-semibold text-white mb-2'>⌨️ Keyboard Support</h3>
            <p className='text-gray-400 text-sm'>
              Ctrl/Cmd + Enter shortcuts, ESC to close, tab navigation
            </p>
          </div>
        </div>
      </section>

      {/* Migration Guide */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold text-white'>Migration from QuickTaskPopover</h2>
        <div className='bg-green-900/20 border border-green-600/30 rounded-lg p-4'>
          <h3 className='font-semibold text-green-400 mb-2'>✅ Backwards Compatible</h3>
          <p className='text-green-300 text-sm mb-2'>
            Existing QuickTaskPopover imports will continue to work without changes.
          </p>
          <pre className='bg-green-900/40 p-3 rounded text-sm text-green-200'>
            {`// Old way (still works)
import QuickTaskPopover from './modals/QuickTaskPopover'

// New recommended way
import TaskPopover from './modals/TaskPopover'
// or
import { TaskPopover } from './modals'`}
          </pre>
        </div>
      </section>

      {/* Actual TaskPopover Components */}
      <TaskPopover
        isOpen={createMode}
        onClose={() => setCreateMode(false)}
        mode='create'
        clickCoords={clickCoords}
        selectedDate={selectedDate}
        clientId={clientId}
        onCreateTask={handleCreateTask}
      />

      <TaskPopover
        isOpen={editMode}
        onClose={() => setEditMode(false)}
        mode='edit'
        clickCoords={clickCoords}
        selectedDate={new Date(selectedTask?.scheduled_at || Date.now())}
        clientId={clientId}
        existingTask={selectedTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      <TaskPopover
        isOpen={aiMode}
        onClose={() => setAiMode(false)}
        mode='ai-generate'
        clickCoords={clickCoords}
        selectedDate={selectedDate}
        clientId={clientId}
        aiPrompt='Crear posts para campaña de verano'
        onCreateTask={handleCreateTask}
      />
    </div>
  )
}

export default TaskPopoverExamples
