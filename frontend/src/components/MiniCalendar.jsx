import { useState } from 'react';

const DAY_JS   = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const CAL_HEADS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTH_FMT = { month: 'long', year: 'numeric' };

export default function MiniCalendar({ value, onChange, operatingHours, minDate, selectedDates, onToggle }) {
  const multiMode = Array.isArray(selectedDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const floor = minDate ?? today;

  const [viewYear,  setViewYear]  = useState(floor.getFullYear());
  const [viewMonth, setViewMonth] = useState(floor.getMonth());

  const isOpen = d => {
    if (!operatingHours || Object.keys(operatingHours).length === 0) return true;
    return !!operatingHours[DAY_JS[d.getDay()]];
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const floorYear  = floor.getFullYear();
  const floorMonth = floor.getMonth();
  const isPrevDisabled =
    viewYear < floorYear || (viewYear === floorYear && viewMonth <= floorMonth);

  // Monday-first offset: Mon=0 … Sun=6
  const firstDow       = new Date(viewYear, viewMonth, 1).getDay();
  const mondayOffset   = (firstDow + 6) % 7;
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev     = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = mondayOffset - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, outside: true });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, outside: false });
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - (mondayOffset + daysInMonth) + 1, outside: true });

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', MONTH_FMT);

  return (
    <div style={c.wrap}>
      <div style={c.header}>
        <span style={c.monthLabel}>{monthLabel}</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={prevMonth} disabled={isPrevDisabled}
            style={{ ...c.navBtn, opacity: isPrevDisabled ? 0.3 : 1 }}>‹</button>
          <button onClick={nextMonth} style={c.navBtn}>›</button>
        </div>
      </div>

      <div style={c.weekRow}>
        {CAL_HEADS.map(h => <div key={h} style={c.weekHead}>{h}</div>)}
      </div>

      <div style={c.grid}>
        {cells.map((cell, i) => {
          if (cell.outside)
            return <div key={i} style={c.outsideCell}>{cell.day}</div>;

          const d        = new Date(viewYear, viewMonth, cell.day);
          const dateStr  = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
          const isPast   = d < floor;
          const isClosed = !isOpen(d);
          const isToday  = d.getTime() === today.getTime();
          const selIdx   = multiMode ? selectedDates.indexOf(dateStr) : -1;
          const isSel    = multiMode ? selIdx !== -1 : value === dateStr;
          const isMaxed  = multiMode && selectedDates.length >= 3 && !isSel;
          const disabled = isPast || isClosed || isMaxed;

          const handleClick = () => {
            if (multiMode) onToggle(dateStr);
            else onChange(dateStr);
          };

          let st = { ...c.cell };
          if      (isSel)     st = { ...st, ...c.cellSel };
          else if (disabled)  st = { ...st, ...c.cellDis };
          else if (isToday)   st = { ...st, ...c.cellToday };
          else                st = { ...st, ...c.cellAvail };

          const slotNumber = multiMode && selIdx !== -1 ? selIdx + 1 : null;

          return (
            <button key={i} disabled={disabled} onClick={handleClick} style={st}
              title={isClosed ? 'Closed' : isPast ? 'Past' : isMaxed ? '3 dates selected' : dateStr}>
              <span style={{ ...c.dayNum, color: isSel ? '#fff' : disabled ? 'var(--text-light)' : 'var(--text)' }}>
                {cell.day}
              </span>
              {isClosed && !isPast && <span style={c.closedDot} />}
              {isSel && !multiMode && <span style={c.check}>✓</span>}
              {isSel && multiMode && <span style={c.check}>{slotNumber}</span>}
              {isToday && !isSel && <span style={c.todayDot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const c = {
  wrap:       { userSelect: 'none' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  monthLabel: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' },
  navBtn:     { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  weekRow:    { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 },
  weekHead:   { textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '2px 0' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 },
  cell:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 34, borderRadius: 8, border: '1.5px solid transparent', cursor: 'pointer', transition: 'all .12s ease', position: 'relative', gap: 1 },
  cellAvail:  { background: 'rgba(236,72,153,.1)', borderColor: 'rgba(236,72,153,.2)' },
  cellSel:    { background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(124,58,237,.4)', transform: 'scale(1.04)' },
  cellDis:    { background: 'var(--surface)', borderColor: 'transparent', cursor: 'not-allowed', opacity: 0.35 },
  cellToday:  { background: 'rgba(236,72,153,.1)', borderColor: '#7C3AED', boxShadow: '0 0 0 2px rgba(124,58,237,.15)' },
  outsideCell:{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 34, fontSize: 11, color: 'var(--text-light)', opacity: 0.25 },
  dayNum:     { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, lineHeight: 1 },
  closedDot:  { width: 3, height: 3, borderRadius: '50%', background: '#DC2626', flexShrink: 0 },
  check:      { fontSize: 8, color: 'rgba(255,255,255,.9)', fontWeight: 700 },
  todayDot:   { width: 3, height: 3, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 },
};
