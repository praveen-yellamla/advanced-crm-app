import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const TaskCalendar = ({ tasks, onTaskClick }) => {
  const events = tasks?.map(task => ({
    id: task.id,
    title: task.title,
    start: new Date(task.dueDate),
    end: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000), // 1 hour duration
    resource: task,
    allDay: false
  })) || [];

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6';
    if (event.resource.priority === 'Urgent') backgroundColor = '#e11d48';
    if (event.resource.status === 'COMPLETED') backgroundColor = '#10b981';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 8px'
      }
    };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl h-[800px]"
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={(event) => onTaskClick(event.resource)}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day']}
        className="custom-calendar"
      />
      <style>{`
        .custom-calendar .rbc-header {
          padding: 15px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 1px;
          color: #64748b;
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-calendar .rbc-off-range-bg {
          background: #f8fafc;
        }
        .custom-calendar .rbc-today {
          background: #eff6ff;
        }
        .custom-calendar .rbc-event {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .custom-calendar .rbc-toolbar button {
          border-radius: 12px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 1px;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 8px 16px;
        }
        .custom-calendar .rbc-toolbar button:hover {
          background: #f8fafc;
        }
        .custom-calendar .rbc-toolbar button.rbc-active {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }
      `}</style>
    </motion.div>
  );
};

export default TaskCalendar;
