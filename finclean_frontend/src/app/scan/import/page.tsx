'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { PlatformLayout } from '@/components/platform-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getSeverityColor } from '@/lib/utils/severity';

export default function ScanImportPage() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedVulns, setExtractedVulns] = useState<any[]>([]);
  const [parsedFile, setParsedFile] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setParsedFile(file.name);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    await new Promise(resolve => setTimeout(resolve, 2500));
    clearInterval(progressInterval);
    setUploadProgress(100);

    const mockExtractedData = [
      { id: '1', title: 'SQL Injection in payment API', severity: 'critical', cvss: 9.2 },
      { id: '2', title: 'Cross-Site Scripting (XSS)', severity: 'high', cvss: 7.8 },
      { id: '3', title: 'Outdated SSL/TLS configuration', severity: 'medium', cvss: 5.3 },
      { id: '4', title: 'Missing security headers', severity: 'low', cvss: 3.1 }
    ];

    setExtractedVulns(mockExtractedData);
    setUploading(false);

    toast({
      title: 'File parsed successfully',
      description: `Extracted ${mockExtractedData.length} vulnerabilities`,
    });
  };

  const handleImport = () => {
    toast({
      title: 'Import successful',
      description: `${extractedVulns.length} vulnerabilities added to your dashboard`,
    });

    setTimeout(() => {
      setExtractedVulns([]);
      setParsedFile(null);
      setUploadProgress(0);
    }, 2000);
  };

  return (
    <PlatformLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Scan Results</h1>
          <p className="text-muted-foreground">
            Upload vulnerability scan reports in PDF format
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Scan Report
              </CardTitle>
              <CardDescription>
                Supports PDF reports from Nessus, OpenVAS, Qualys, and other scanners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative rounded-lg border-2 border-dashed p-12 text-center transition-colors
                  ${isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-emerald-500/50'}
                `}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <FileText className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Drop your PDF report here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 50MB
                  </p>
                </div>
              </div>

              {uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Parsing {parsedFile}...</span>
                    <span className="text-emerald-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {extractedVulns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      Extracted Vulnerabilities
                    </CardTitle>
                    <CardDescription>
                      {extractedVulns.length} vulnerabilities found in {parsedFile}
                    </CardDescription>
                  </div>
                  <Button onClick={handleImport}>
                    Import to Dashboard
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {extractedVulns.map((vuln, index) => (
                    <motion.div
                      key={vuln.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{vuln.title}</h4>
                          <Badge
                            className={getSeverityColor(vuln.severity)}
                            variant="outline"
                          >
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          CVSS Score: {vuln.cvss}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Supported Formats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Nessus (.pdf export)</p>
              <p>• OpenVAS (.pdf report)</p>
              <p>• Qualys (.pdf summary)</p>
              <p>• Burp Suite (.pdf findings)</p>
              <p>• Custom vulnerability reports with structured data</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
