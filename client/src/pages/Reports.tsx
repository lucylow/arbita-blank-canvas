import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Search, Filter, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

// Rich mock data for reports
const reportsData = [
  { id: "AUD-2025-001", date: "2025-12-01 09:15:22", target: "GPT-4o", type: "Full Security Suite", score: 98, status: "PASSED", vulnerabilities: 0 },
  { id: "AUD-2025-002", date: "2025-11-30 14:30:45", target: "Claude 3 Opus", type: "Prompt Injection", score: 95, status: "PASSED", vulnerabilities: 1 },
  { id: "AUD-2025-003", date: "2025-11-29 11:20:10", target: "Llama 3 70B", type: "PII Leakage", score: 82, status: "WARNING", vulnerabilities: 3 },
  { id: "AUD-2025-004", date: "2025-11-28 16:45:33", target: "Mistral Large", type: "Bias & Toxicity", score: 88, status: "PASSED", vulnerabilities: 2 },
  { id: "AUD-2025-005", date: "2025-11-28 09:10:00", target: "Custom Finetune v2", type: "Full Security Suite", score: 45, status: "FAILED", vulnerabilities: 12 },
  { id: "AUD-2025-006", date: "2025-11-27 13:22:15", target: "GPT-3.5 Turbo", type: "Jailbreak Resistance", score: 76, status: "WARNING", vulnerabilities: 5 },
  { id: "AUD-2025-007", date: "2025-11-26 10:05:55", target: "Grok-1", type: "Hallucination Check", score: 91, status: "PASSED", vulnerabilities: 1 },
  { id: "AUD-2025-008", date: "2025-11-25 15:40:30", target: "Gemini Pro 1.5", type: "Data Exfiltration", score: 99, status: "PASSED", vulnerabilities: 0 },
  { id: "AUD-2025-009", date: "2025-11-24 08:55:12", target: "Internal Dev Model", type: "Full Security Suite", score: 62, status: "FAILED", vulnerabilities: 8 },
  { id: "AUD-2025-010", date: "2025-11-23 12:15:44", target: "GPT-4o", type: "Adversarial Attack", score: 97, status: "PASSED", vulnerabilities: 0 },
];

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reportsData.filter(report => 
    report.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground glitch-text" data-text="AUDIT REPORTS">AUDIT REPORTS</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">ARCHIVED SECURITY EVALUATIONS // TOTAL RECORDS: {reportsData.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Download className="w-4 h-4 mr-2" />
            EXPORT ALL CSV
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              REPORT ARCHIVE
            </CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by ID, Target, or Type..." 
                  className="pl-8 bg-background/50 border-input font-mono text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="font-mono text-xs text-muted-foreground">AUDIT ID</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">TIMESTAMP</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">TARGET MODEL</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">AUDIT TYPE</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-center">SCORE</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-secondary/30 transition-colors border-border/50">
                    <TableCell className="font-mono text-xs font-bold text-primary">{report.id}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{report.date}</TableCell>
                    <TableCell className="font-mono text-sm">{report.target}</TableCell>
                    <TableCell className="font-mono text-xs">{report.type}</TableCell>
                    <TableCell className="font-mono text-sm font-bold text-center">
                      <span className={
                        report.score >= 90 ? "text-primary" :
                        report.score >= 70 ? "text-yellow-500" :
                        "text-destructive"
                      }>{report.score}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        report.status === "PASSED" ? "border-primary text-primary bg-primary/10" :
                        report.status === "WARNING" ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" :
                        "border-destructive text-destructive bg-destructive/10"
                      }>
                        {report.status === "PASSED" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {report.status === "WARNING" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {report.status === "FAILED" && <XCircle className="w-3 h-3 mr-1" />}
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
