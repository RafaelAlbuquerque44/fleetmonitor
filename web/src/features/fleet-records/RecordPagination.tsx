import { useState } from "react";

const pageSize = 5;

export function paginateRecords<T>(records: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  return {
    items: records.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    page: currentPage,
    totalPages,
  };
}

export function useRecordPagination<T>(records: T[]) {
  const [page, setPage] = useState(1);
  return { ...paginateRecords(records, page), setPage };
}

export function RecordPagination({
  label,
  page,
  totalPages,
  onPageChange,
}: {
  label: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const buttonClass = "rounded-lg border border-[#dfe5dd] px-3 py-2 text-xs font-medium text-[#526056] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-50 dark:border-fleet-border dark:text-[#d9e1da] dark:hover:bg-fleet-highlight";
  return (
    <nav aria-label={`Paginação de ${label}`} className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">Página {page} de {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" className={buttonClass} disabled={page === 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <button type="button" className={buttonClass} disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Próxima</button>
      </div>
    </nav>
  );
}
