import {formatCalendarDate} from './calendarDate';
test('datas civis não retrocedem um dia por interpretação UTC',()=>{
  expect(formatCalendarDate('2026-01-01')).toBe('01/01/2026');
  expect(formatCalendarDate('2024-02-29')).toBe('29/02/2024');
  expect(formatCalendarDate('2026-02-29')).toBe('—');
  expect(formatCalendarDate('inválida')).toBe('—');
  expect(formatCalendarDate(null)).toBe('—');
});
