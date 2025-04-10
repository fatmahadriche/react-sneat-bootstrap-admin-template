import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from '@fullcalendar/core/locales/fr';
import "./Calendar.css";

const CalendarDashboard = () => {
    const [events, setEvents] = useState([
        {
            id: 1,
            title: 'Réunion Client Premium',
            start: new Date().setHours(10, 0, 0),
            end: new Date().setHours(12, 0, 0),
            color: '#6366f1',
            extendedProps: {
                location: 'Salle Conférence A',
                description: 'Présentation des nouveaux produits'
            }
        },
        {
            id: 2,
            title: 'Revue Trimestrielle',
            start: new Date(new Date().setDate(new Date().getDate() + 3)).setHours(14, 0, 0),
            color: '#10b981',
            extendedProps: {
                participants: ['Équipe Direction', 'Équipe Marketing']
            }
        }
    ]);

    const calendarRef = useRef(null);

    const handleDateClick = (arg) => {
        const title = prompt("Titre de l'événement :");
        if (title) {
            const newEvent = {
                id: Date.now(),
                title,
                start: arg.date,
                end: new Date(arg.date.getTime() + 2 * 60 * 60 * 1000), // +2 heures
                color: getEventColor(),
                extendedProps: {
                    createdAt: new Date()
                }
            };
            setEvents([...events, newEvent]);
        }
    };

    const getEventColor = () => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleEventClick = (clickInfo) => {
        if (confirm(`Voulez-vous supprimer "${clickInfo.event.title}" ?`)) {
            setEvents(events.filter(e => e.id !== clickInfo.event.id));
        }
    };

    return (
        <div className="calendar-wrapper">
            <div className="calendar-toolbar">
                <button 
                    onClick={() => calendarRef.current.getApi().today()}
                    className="calendar-today-btn"
                >
                    Aujourd'hui
                </button>
                <div className="calendar-view-buttons">
                    <button onClick={() => calendarRef.current.getApi().changeView('dayGridMonth')}>
                        Mois
                    </button>
                    <button onClick={() => calendarRef.current.getApi().changeView('timeGridWeek')}>
                        Semaine
                    </button>
                    <button onClick={() => calendarRef.current.getApi().changeView('timeGridDay')}>
                        Jour
                    </button>
                </div>
            </div>

            <div className="calendar-content">
                <div className="calendar-main">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                        initialView="dayGridMonth"
                        locale={frLocale}
                        headerToolbar={false}
                        events={events}
                        nowIndicator={true}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        weekends={true}
                        dayMaxEvents={true}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        eventContent={renderEventContent}
                        height="auto"
                    />
                </div>

                <div className="calendar-sidebar">
                    <div className="upcoming-events">
                        <h3>Événements à venir</h3>
                        <div className="events-list">
                            {events
                                .sort((a, b) => new Date(a.start) - new Date(b.start))
                                .map(event => (
                                    <EventItem key={event.id} event={event} />
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventItem = ({ event }) => (
    <div className="event-card" style={{ borderLeft: `4px solid ${event.color}` }}>
        <div className="event-time">
            {new Date(event.start).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })}
        </div>
        <div className="event-details">
            <h4>{event.title}</h4>
            {event.extendedProps?.location && (
                <p className="event-location">
                    <i className="bx bx-map"></i> {event.extendedProps.location}
                </p>
            )}
        </div>
    </div>
);

const renderEventContent = (eventInfo) => (
    <div className="fc-event-content">
        <i className="bx bx-calendar-event"></i>
        <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
);

export default CalendarDashboard;