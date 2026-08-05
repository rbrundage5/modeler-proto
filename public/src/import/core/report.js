export function createImportReport(fileName, profileId) {
  return {
    fileName, profileId, startedAt:new Date().toISOString(), completedAt:null,
    elements:{created:0,updated:0,skipped:0}, relationships:{created:0,updated:0,skipped:0},
    diagrams:{created:0,updated:0}, presentations:{created:0}, navigation:{created:0},
    warnings:[], errors:[], sheets:[], provenance:[]
  };
}
export function finishImportReport(report) { report.completedAt = new Date().toISOString(); return report; }
export function downloadImportReport(report) {
  const blob = new Blob([JSON.stringify(report,null,2)], {type:'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${report.fileName.replace(/\.[^.]+$/,'')}-import-report.json`;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
