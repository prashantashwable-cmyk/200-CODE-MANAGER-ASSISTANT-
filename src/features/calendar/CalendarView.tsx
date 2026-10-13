import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/design-system';
import { addDaysKey, parseKey, todayKey } from '@/features/logistics/deliverySlots';
import { groupByDate, monthGrid, sameMonth, shiftCursor, weekDays } from './calendarMath';
import type { CalendarEvent, CalendarMode } from './calendarMath';

const LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

interface CalendarViewProps {
  mode: CalendarMode;
  /** Any date inside the visible range. */
  cursor: string;
  onCursorChange: (key: string) => void;
  events: CalendarEvent[];
  selected: string | null;
  onSelect: (key: string) => void;
  /** Agenda mode lists events itself; the caller says how a row looks. */
  renderAgendaRow?: (event: CalendarEvent) => React.ReactNode;
}

/** A calendar that colours by the app's status palette and, on a phone,
 *  shows dots — the selected day's detail is the caller's panel below, never
 *  a popover balanced over a small grid. */
export function CalendarView({ mode, cursor, onCursorChange, events, selected, onSelect, renderAgendaRow }: CalendarViewProps) {
  const { t, i18n } = useTranslation();
  const locale = LOCALE[i18n.language] ?? 'en-IN';
  const today = todayKey(Date.now());
  const byDate = useMemo(() => groupByDate(events), [events]);

  const title = useMemo(() => {
    if (mode === 'month') return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseKey(cursor));
    const days = weekDays(cursor);
    const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    const last = mode === 'week' ? days[6] : addDaysKey(cursor, 13);
    return `${fmt.format(parseKey(mode === 'week' ? days[0] : cursor))} – ${fmt.format(parseKey(last))}`;
  }, [mode, cursor, locale]);

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return weekDays(today).map((d) => fmt.format(parseKey(d)));
  }, [locale, today]);

  const nav = (
    <div className="row between gap-2 mb-2">
      <span className="t-md t-semibold" aria-live="polite">
        {title}
      </span>
      <div className="row gap-1">
        <Button size="sm" variant="ghost" aria-label={t('calendar.previous')} icon={<CaretLeft size={16} />} onClick={() => onCursorChange(shiftCursor(cursor, mode, -1))} />
        <Button size="sm" variant="ghost" onClick={() => onCursorChange(today)}>
          {t('calendar.today')}
        </Button>
        <Button size="sm" variant="ghost" aria-label={t('calendar.next')} icon={<CaretRight size={16} />} onClick={() => onCursorChange(shiftCursor(cursor, mode, 1))} />
      </div>
    </div>
  );

  if (mode === 'agenda') {
    const dates = Array.from({ length: 30 }, (_, i) => addDaysKey(cursor, i)).filter((d) => byDate.has(d));
    return (
      <div>
        {nav}
        {dates.length === 0 ? (
          <p className="t-sm t-muted">{t('calendar.agendaEmpty')}</p>
        ) : (
          <div className="stack gap-3">
            {dates.map((d) => (
              <section key={d} className="stack gap-1" aria-label={d}>
                <h3 className="label">{new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short' }).format(parseKey(d))}</h3>
                {byDate.get(d)!.map((e) => (
                  <div key={e.id}>{renderAgendaRow ? renderAgendaRow(e) : e.label}</div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  const cells = mode === 'month' ? monthGrid(cursor) : weekDays(cursor);
  return (
    <div>
      {nav}
      <div className={`cal cal--${mode}`} role="grid" aria-label={title}>
        <div className="cal__head" role="row">
          {weekdayLabels.map((w) => (
            <span key={w} className="cal__weekday" role="columnheader">
              {w}
            </span>
          ))}
        </div>
        <div className="cal__body">
          {cells.map((d) => {
            const dayEvents = byDate.get(d) ?? [];
            const outside = mode === 'month' && !sameMonth(d, cursor);
            return (
              <button
                key={d}
                type="button"
                role="gridcell"
                className={['cal__cell', d === today ? 'cal__cell--today' : '', d === selected ? 'cal__cell--selected' : '', outside ? 'cal__cell--outside' : ''].join(' ')}
                aria-selected={d === selected}
                aria-label={`${new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(parseKey(d))}, ${t('calendar.eventCount', { count: dayEvents.length })}`}
                onClick={() => onSelect(d)}
              >
                <span className="cal__date">{parseKey(d).getDate()}</span>
                <span className="cal__dots" aria-hidden="true">
                  {dayEvents.slice(0, 4).map((e) => (
                    <span key={e.id} className={`cal__dot cal__dot--${e.tone}`} />
                  ))}
                </span>
                {mode === 'week' && (
                  <span className="cal__chips" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className={`cal__chip cal__chip--${e.tone}`}>
                        {e.label}
                      </span>
                    ))}
                    {dayEvents.length > 3 && <span className="cal__more">+{dayEvents.length - 3}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
