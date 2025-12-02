export function generateMemberId(count: number): string {
  return 'MBR-' + String(count + 1).padStart(5, '0');
}
