import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from '@fullcalendar/core/locales/fr';
import { ChevronLeft, ChevronRight } from 'react-feather';
import "./Calendar.css";

const CalendarDashboard = () => {
    const [events, setEvents] = useState([
        {
            id: 1,
            title: 'Réunion Client',
            start: new Date().setHours(10, 0, 0),
            end: new Date().setHours(12, 0, 0),
            color: '#5C6BC0',
            extendedProps: {
                location: 'Salle Conférence A',
                description: 'Présentation des nouveaux produits'
            }
        }
    ]);

    const calendarRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const handlePrev = () => {
        calendarRef.current.getApi().prev();
        setCurrentDate(calendarRef.current.getApi().getDate());
    };

    const handleNext = () => {
        calendarRef.current.getApi().next();
        setCurrentDate(calendarRef.current.getApi().getDate());
    };

    const handleToday = () => {
        calendarRef.current.getApi().today();
        setCurrentDate(new Date());
    };

    const handleViewChange = (view) => {
        calendarRef.current.getApi().changeView(view);
    };

    return (
        <div className="calendar-wrapper">
            <div className="calendar-toolbar">
                <div className="date-navigation">
                    <button className="nav-button" onClick={handlePrev}>
                        <ChevronLeft size={18} />
                    </button>
                    <div className="date-display">
                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </div>
                    <button className="nav-button" onClick={handleNext}>
                        <ChevronRight size={18} />
                    </button>
                    <button
                        className="view-button"
                        onClick={handleToday}
                        style={{ marginLeft: '1rem' }}
                    >
                        Aujourd'hui
                    </button>
                </div>

                <div className="view-selector">
                    {['dayGridMonth', 'timeGridWeek', 'timeGridDay'].map(view => (
                        <button
                            key={view}
                            className={`view-button ${calendarRef.current?.getApi().view.type === view ? 'active' : ''
                                }`}
                            onClick={() => handleViewChange(view)}
                        >
                            {view.replace(/[A-Z]/g, ' $&').replace('Grid', '').trim()}
                        </button>
                    ))}
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
                        editable={true}
                        selectable={true}
                        weekends={true}
                        dayMaxEvents={true}
                        height="auto"
                        eventContent={renderEventContent}
                    />
                </div>

                <div className="calendar-sidebar">
                    <div className="upcoming-events">
                        <h3>Événements à venir</h3>
                        <div className="events-list">
                            {events.map(event => (
                                <EventItem key={event.id} event={event} />
                            ))}
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