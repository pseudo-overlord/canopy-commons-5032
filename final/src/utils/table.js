export const PAGE_SIZE = 10;
export function selectRows(
  rows,
  columns,
  { search = "", filters = {}, sortKey = "", direction = "asc" } = {},
) {
  const normalise = (value) => String(value ?? "").toLocaleLowerCase();
  const query = normalise(search).trim();
  const result = rows.filter(
    (row) =>
      (!query ||
        columns.some(({ key }) => normalise(row[key]).includes(query))) &&
      columns.every(({ key }) =>
        normalise(row[key]).includes(normalise(filters[key]).trim()),
      ),
  );
  const column = columns.find(({ key }) => key === sortKey);
  if (column)
    result.sort((a, b) => {
      const difference = column.numeric
        ? Number(a[sortKey] ?? 0) - Number(b[sortKey] ?? 0)
        : String(a[sortKey] ?? "").localeCompare(
            String(b[sortKey] ?? ""),
            "en",
            { numeric: true, sensitivity: "base" },
          );
      return direction === "desc" ? -difference : difference;
    });
  return result;
}
export function pageRows(rows, page) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.max(
    1,
    Math.min(pages, Number.isInteger(page) ? page : 1),
  );
  return {
    rows: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    page: current,
    pages,
  };
}
// Put every cell in quotes, and add a quote in front of anything a spreadsheet
// might otherwise read as a formula.
export function csvText(rows, columns) {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
      text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      columns.map((c) => cell(c.label)).join(","),
      ...rows.map((row) => columns.map((c) => cell(row[c.key])).join(",")),
    ].join("\r\n")
  );
}
export function downloadCsv(rows, columns, filename) {
  const url = URL.createObjectURL(
    new Blob([csvText(rows, columns)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[^a-z0-9-]/gi, "-")}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
