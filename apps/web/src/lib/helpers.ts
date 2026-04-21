export const createId = (prefix: string): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
};

export const formatDateTime = (value: string | null): string => {
  if (!value) {
    return 'Not yet recorded';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const toCsv = (rows: Record<string, string | number>[]): string => {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number): string => {
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header] ?? '')).join(',')),
  ].join('\n');
};

export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getRoleLabel = (role: string): string => role.charAt(0).toUpperCase() + role.slice(1);
