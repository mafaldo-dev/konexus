/** Datas de competência/vencimento são datas civis, não instantes UTC. */
export function formatCalendarDate(value?:string|null):string {
  if(!value)return '—';
  if(/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year,month,day]=value.split('-');
    const date=new Date(`${value}T12:00:00Z`);
    if(!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==value)return '—';
    return `${day}/${month}/${year}`;
  }
  const instant=new Date(value);
  return Number.isFinite(instant.getTime())?instant.toLocaleDateString('pt-BR'):'—';
}
