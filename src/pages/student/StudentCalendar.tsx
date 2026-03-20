import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, MapPin, Tag } from "lucide-react";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, isAfter, isBefore, addDays } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: "exam" | "holiday" | "event" | "deadline";
  description?: string;
}

// Static academic calendar data — in production, this would come from a DB table
const ACADEMIC_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Semester Start", date: new Date(2026, 0, 6), type: "event", description: "Spring semester classes begin" },
  { id: "2", title: "Republic Day", date: new Date(2026, 0, 26), type: "holiday", description: "National holiday" },
  { id: "3", title: "Mid-Semester Exams", date: new Date(2026, 2, 2), endDate: new Date(2026, 2, 10), type: "exam", description: "Mid-semester examination period" },
  { id: "4", title: "Holi", date: new Date(2026, 2, 17), type: "holiday", description: "Festival of colors" },
  { id: "5", title: "Assignment Submission Deadline", date: new Date(2026, 2, 25), type: "deadline", description: "Last date for assignment submissions" },
  { id: "6", title: "End-Semester Exams", date: new Date(2026, 3, 20), endDate: new Date(2026, 4, 5), type: "exam", description: "Final examination period" },
  { id: "7", title: "Summer Break Begins", date: new Date(2026, 4, 10), type: "holiday", description: "Summer vacation starts" },
  { id: "8", title: "Independence Day", date: new Date(2026, 7, 15), type: "holiday", description: "National holiday" },
  { id: "9", title: "Odd Semester Start", date: new Date(2026, 7, 1), type: "event", description: "Fall semester classes begin" },
  { id: "10", title: "Dussehra", date: new Date(2026, 9, 2), type: "holiday", description: "Festival" },
  { id: "11", title: "Diwali Break", date: new Date(2026, 9, 20), endDate: new Date(2026, 9, 25), type: "holiday", description: "Diwali vacation" },
  { id: "12", title: "Internal Assessment", date: new Date(2026, 10, 10), endDate: new Date(2026, 10, 15), type: "exam", description: "Internal assessment period" },
  { id: "13", title: "Project Submission", date: new Date(2026, 10, 30), type: "deadline", description: "Final project submission deadline" },
  { id: "14", title: "End-Semester Exams", date: new Date(2026, 11, 5), endDate: new Date(2026, 11, 20), type: "exam", description: "Final examination period" },
  { id: "15", title: "Winter Break", date: new Date(2026, 11, 22), endDate: new Date(2027, 0, 2), type: "holiday", description: "Winter vacation" },
];

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  exam: { color: "text-destructive", bg: "bg-destructive/10", label: "Exam" },
  holiday: { color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", label: "Holiday" },
  event: { color: "text-primary", bg: "bg-primary/10", label: "Event" },
  deadline: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", label: "Deadline" },
};

const StudentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getEventsForDate = (date: Date) =>
    ACADEMIC_EVENTS.filter((e) => {
      if (e.endDate) {
        return (
          (isAfter(date, addDays(e.date, -1)) && isBefore(date, addDays(e.endDate, 1)))
        );
      }
      return isSameDay(date, e.date);
    });

  const selectedEvents = getEventsForDate(selectedDate);

  const upcomingEvents = ACADEMIC_EVENTS
    .filter((e) => isAfter(e.date, new Date()) || (e.endDate && isAfter(e.endDate, new Date())))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  // Highlight dates that have events
  const eventDates = ACADEMIC_EVENTS.flatMap((e) => {
    if (e.endDate) {
      const dates: Date[] = [];
      let current = new Date(e.date);
      while (current <= e.endDate) {
        dates.push(new Date(current));
        current = addDays(current, 1);
      }
      return dates;
    }
    return [e.date];
  });

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Academic Calendar"
      subtitle="Stay updated with important dates and events"
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <GlassCard className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{ event: eventDates }}
              modifiersClassNames={{ event: "bg-primary/20 font-bold rounded-full" }}
              className="w-full"
            />

            {/* Selected date events */}
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">
                {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events on this date</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => {
                    const config = typeConfig[event.type];
                    return (
                      <div key={event.id} className={`p-3 rounded-lg ${config.bg}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className={`font-medium text-sm mt-1 ${config.color}`}>
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-6">Upcoming Events</h2>

            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event, i) => {
                  const config = typeConfig[event.type];
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-4 p-4 rounded-xl border border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedDate(event.date)}
                    >
                      {/* Date badge */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-primary uppercase">
                          {format(event.date, "MMM")}
                        </span>
                        <span className="text-lg font-bold text-primary leading-none">
                          {format(event.date, "d")}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                        {event.endDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(event.date, "MMM d")} – {format(event.endDate, "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <GlassCard className="p-4">
              <div className="flex flex-wrap gap-4">
                {Object.entries(typeConfig).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${val.bg} border ${val.color.includes("destructive") ? "border-destructive/40" : "border-current"}`} />
                    <span className="text-xs text-muted-foreground capitalize">{val.label}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCalendar;
