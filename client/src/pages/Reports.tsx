import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Search, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, BarChart3 } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { showSuccessNotification, showErrorNotification, apiClient } from "@/lib/error-handler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Report {
  id: string;
  date: string;
  target: string;
  type: string;
  score: number;
  status: string;
  vulnerabilities: number;
  duration?: number;
  testsRun?: number;
}

interface DetailedReport extends Report {
  summary: string;
  findings: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    location: string;
  }>;
  recommendations: string[];
  metadata: {
    duration: number;
    testsRun: number;
    agent: string;
    sessionId: string;
  };
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedReport, setSelectedReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filterReports = useCallback(() => {
    let filtered = [...reports];

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Report[]>('/api/reports');
      const reportsArray = Array.isArray(data) ? data : [];
      setReports(reportsArray);
      setFilteredReports(reportsArray);
    } catch (error) {
      showErrorNotification(error, { title: 'Failed to load reports' });
      setReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    filterReports();
  }, [filterReports]);

  const toggleRow = (reportId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedRows(newExpanded);
  };

  const viewReportDetails = async (reportId: string) => {
    try {
      const detailed = await apiClient.get<DetailedReport>(`/api/reports/${reportId}`);
      setSelectedReport(detailed);
      setShowDetailsDialog(true);
    } catch (error) {
      showErrorNotification(error, { title: 'Failed to load report details' });
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Target Model', 'Type', 'Score', 'Status', 'Vulnerabilities'];
      const rows = filteredReports.map(report => [
        report.id,
        report.date,
        report.target,
        report.type,
        report.score.toString(),
        report.status,
        report.vulnerabilities.toString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-reports-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccessNotification('Reports exported successfully');
    } catch (error) {
      showErrorNotification(error, { title: 'Failed to export reports' });
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const report = await apiClient.get<DetailedReport>(`/api/reports/${reportId}`);

      const reportContent = {
        ...report,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportId}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccessNotification(`Report ${reportId} downloaded`);
    } catch (error) {
      showErrorNotification(error, { title: 'Failed to download report' });
    }
  };

  // Calculate statistics for chart
  const reportsArray = Array.isArray(filteredReports) ? filteredReports : [];
  const statusDistribution = reportsArray.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      PASSED: '#00FF41',
      WARNING: '#FFFF00',
      FAILED: '#FF003C',
    };
    return colorMap[status] || '#888';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground glitch-text" data-text="AUDIT REPORTS">AUDIT REPORTS</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">
            ARCHIVED SECURITY EVALUATIONS // TOTAL RECORDS: {reports.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            disabled={loading}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={exportToCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-sm font-mono text-muted-foreground">TOTAL REPORTS</div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">{reports.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-primary/50">
          <CardContent className="p-4">
            <div className="text-sm font-mono text-muted-foreground">PASSED</div>
            <div className="text-2xl font-bold font-mono text-primary mt-1">
              {reports.filter(r => r.status === 'PASSED').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-yellow-500/50">
          <CardContent className="p-4">
            <div className="text-sm font-mono text-muted-foreground">WARNINGS</div>
            <div className="text-2xl font-bold font-mono text-yellow-500 mt-1">
              {reports.filter(r => r.status === 'WARNING').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-destructive/50">
          <CardContent className="p-4">
            <div className="text-sm font-mono text-muted-foreground">FAILED</div>
            <div className="text-2xl font-bold font-mono text-destructive mt-1">
              {reports.filter(r => r.status === 'FAILED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Chart */}
      {chartData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              STATUS DISTRIBUTION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PASSED">Passed</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground font-mono">Loading reports...</p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow>
                    <TableHead className="font-mono text-xs text-muted-foreground w-12"></TableHead>
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
                    <React.Fragment key={report.id}>
                      <TableRow
                        className="hover:bg-secondary/30 transition-colors border-border/50 cursor-pointer"
                        onClick={() => toggleRow(report.id)}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(report.id);
                            }}
                          >
                            {expandedRows.has(report.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">{report.id}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{report.date}</TableCell>
                        <TableCell className="font-mono text-sm">{report.target}</TableCell>
                        <TableCell className="font-mono text-xs">{report.type}</TableCell>
                        <TableCell className="font-mono text-sm font-bold text-center">
                          <span className={
                            report.score >= 90 ? "text-primary" :
                            report.score >= 70 ? "text-yellow-500" :
                            "text-destructive"
                          }>
                            {report.score}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              report.status === "PASSED" ? "border-primary text-primary bg-primary/10" :
                              report.status === "WARNING" ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" :
                              "border-destructive text-destructive bg-destructive/10"
                            }
                          >
                            {report.status === "PASSED" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {report.status === "WARNING" && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {report.status === "FAILED" && <XCircle className="w-3 h-3 mr-1" />}
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewReportDetails(report.id);
                              }}
                            >
                              <FileText className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadReport(report.id);
                              }}
                            >
                              <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(report.id) && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-secondary/20 p-4">
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-mono text-xs text-muted-foreground">Vulnerabilities:</span>
                                  <span className="font-mono text-sm font-bold ml-2">{report.vulnerabilities}</span>
                                </div>
                                {report.duration && (
                                  <div>
                                    <span className="font-mono text-xs text-muted-foreground">Duration:</span>
                                    <span className="font-mono text-sm font-bold ml-2">{Math.floor(report.duration / 60)}m</span>
                                  </div>
                                )}
                                {report.testsRun && (
                                  <div>
                                    <span className="font-mono text-xs text-muted-foreground">Tests:</span>
                                    <span className="font-mono text-sm font-bold ml-2">{report.testsRun}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewReportDetails(report.id)}
                                  className="border-primary text-primary hover:bg-primary/10"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  VIEW FULL DETAILS
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadReport(report.id)}
                                  className="border-primary text-primary hover:bg-primary/10"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  DOWNLOAD JSON
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                  {filteredReports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-mono">
                        No reports found matching filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">{selectedReport?.id}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {selectedReport?.target} • {selectedReport?.date}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">SCORE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold font-mono ${
                      selectedReport.score >= 90 ? "text-primary" :
                      selectedReport.score >= 70 ? "text-yellow-500" :
                      "text-destructive"
                    }`}>
                      {selectedReport.score}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">STATUS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant="outline"
                      className={
                        selectedReport.status === "PASSED" ? "border-primary text-primary bg-primary/10" :
                        selectedReport.status === "WARNING" ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" :
                        "border-destructive text-destructive bg-destructive/10"
                      }
                    >
                      {selectedReport.status}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">SUMMARY</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm text-foreground">{selectedReport.summary}</p>
                </CardContent>
              </Card>

              {selectedReport.findings && selectedReport.findings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">FINDINGS ({selectedReport.findings.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedReport.findings.map((finding, i) => (
                        <div key={i} className="p-3 border border-border rounded-sm">
                          <div className="font-mono text-sm font-bold">{finding.type}</div>
                          <div className="font-mono text-xs text-muted-foreground mt-1">{finding.location}</div>
                          <div className="font-mono text-xs text-foreground mt-1">{finding.description}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">RECOMMENDATIONS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 font-mono text-sm">
                      {selectedReport.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
