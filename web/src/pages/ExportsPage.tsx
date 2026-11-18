import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FleetAppShell } from "../features/navigation/FleetAppShell";
import { datasets, fetchExportData, type Dataset, type ExportFormat } from "../features/exports/data";
import { downloadExport } from "../features/exports/download";

const formats: { value: ExportFormat; label: string; description: string }[] = [
  { value: "csv", label: "CSV", description: "Arquivo de texto para planilhas e integrações." },
  { value: "xlsx", label: "Excel", description: "Planilha .xlsx com cabeçalho e colunas." },
  { value: "pdf", label: "PDF", description: "Relatório para leitura e impressão." },
];

export function ExportsPage() {
  const [dataset, setDataset] = useState<Dataset>("vehicles");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await fetchExportData(dataset);
      await downloadExport(data, dataset, format);
      setNotice(`Arquivo gerado com ${data.rows.length} ${data.rows.length === 1 ? "registro" : "registros"}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FleetAppShell active="exports" title="Exportação">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">DADOS DA FROTA</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Exportação</h1>
        <p className="mt-2 text-sm text-[#748078] dark:text-[#a7b2a9]">Baixe os registros da sua empresa para analisar, compartilhar ou imprimir.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>1. Escolha os dados</CardTitle>
              <CardDescription>O arquivo incluirá todos os registros da categoria selecionada.</CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset>
                <legend className="sr-only">Tipo de dados</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.entries(datasets) as [Dataset, (typeof datasets)[Dataset]][]).map(([key, item]) => (
                    <label key={key} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${dataset === key ? "border-[#84ad45] bg-[#f4f4f4] dark:border-[#c4f36b] dark:bg-fleet-highlight" : "border-[#e5eae2] hover:bg-[#f7f7f7] dark:border-fleet-border dark:hover:bg-fleet-surface"}`}>
                      <input className="mt-1 accent-[#71963b]" type="radio" name="dataset" value={key} checked={dataset === key} onChange={() => setDataset(key)} />
                      <span><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">{item.description}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>2. Escolha o formato</CardTitle><CardDescription>Selecione como deseja receber os dados.</CardDescription></CardHeader>
            <CardContent>
              <fieldset className="space-y-3">
                <legend className="sr-only">Formato do arquivo</legend>
                {formats.map((item) => (
                  <label key={item.value} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${format === item.value ? "border-[#84ad45] bg-[#f4f4f4] dark:border-[#c4f36b] dark:bg-fleet-highlight" : "border-[#e5eae2] dark:border-fleet-border"}`}>
                    <input className="mt-1 accent-[#71963b]" type="radio" name="format" value={item.value} checked={format === item.value} onChange={() => setFormat(item.value)} />
                    <span><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">{item.description}</span></span>
                  </label>
                ))}
              </fieldset>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Dados e privacidade</CardTitle><CardDescription>O arquivo é gerado no navegador com os dados da empresa autenticada. Motoristas incluem CPF e CNH; proteja o arquivo e compartilhe apenas com pessoas autorizadas.</CardDescription></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardTitle>3. Gerar arquivo</CardTitle><CardDescription>{datasets[dataset].label} · {formats.find((item) => item.value === format)?.label}</CardDescription></CardHeader>
            <CardContent>
              <Button className="w-full" type="submit" disabled={busy}>{busy ? "Gerando arquivo..." : "Baixar arquivo"}</Button>
              {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
              {notice && <p role="status" className="mt-3 text-sm text-[#526f37] dark:text-[#c4f36b]">{notice}</p>}
            </CardContent>
          </Card>
        </form>
      </section>
    </FleetAppShell>
  );
}
