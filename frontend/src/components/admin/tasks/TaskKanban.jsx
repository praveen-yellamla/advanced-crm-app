import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  User, 
  Clock, 
  MoreVertical, 
  AlertCircle,
  CheckCircle2,
  Tag,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLUMNS = [
  { id: 'PENDING', title: 'Pending', color: 'bg-amber-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'FOLLOW_UP', title: 'Follow Up', color: 'bg-purple-500' },
  { id: 'WAITING', title: 'Waiting', color: 'bg-slate-400' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-emerald-500' }
];

const TaskKanban = ({ tasks, onTaskUpdate, onTaskClick }) => {
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    onTaskUpdate(draggableId, { status: destination.droppableId });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'high': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'medium': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* COLUMN HEADER */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-6 rounded-full ${column.color}`} />
                <h3 className="font-bold text-sm text-slate-700 uppercase tracking-widest">{column.title}</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {tasks?.filter(t => t.status === column.id).length || 0}
                </span>
              </div>
            </div>

            {/* DROP ZONE */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-4 min-h-[500px] p-2 rounded-2xl transition-colors ${
                    snapshot.isDraggingOver ? 'bg-slate-50/50' : ''
                  }`}
                >
                  {tasks?.filter(t => t.status === column.id).map((task, index) => (
                    <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick(task)}
                          className={`bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer ${
                            snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50' : ''
                          }`}
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {task.lead && (
                              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                                  {task.lead.customerName?.charAt(0)}
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 truncate">
                                  {task.lead.customerName}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                              <div className="flex items-center gap-4 text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} />
                                  <span className={`text-[10px] font-bold ${
                                    new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' 
                                      ? 'text-rose-500' 
                                      : 'text-slate-400'
                                  }`}>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                                {task.notes && <MessageSquare size={12} />}
                                {task.attachments?.length > 0 && <Paperclip size={12} />}
                              </div>
                              <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500">
                                  {task.assignedTo?.name?.charAt(0) || 'U'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default TaskKanban;
