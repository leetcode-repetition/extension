export function getRepeatDate(dateString: string, daysLater: string): string {
  const date: Date = new Date(dateString);
  date.setDate(date.getDate() + parseInt(daysLater, 10));
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString()}`;
}
