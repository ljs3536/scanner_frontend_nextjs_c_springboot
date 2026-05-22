"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  FileText,
  Download,
} from "lucide-react";

type ScanTabMode = "file" | "code";

// 💡 1. 백엔드에서 넘어오는 응답 데이터 타입 정의 (명세서 기준)
interface ScanResult {
  scanId: string;
  target: string;
  startedAt: string;
  durationMs: number;
  sbomId?: string;
  issuesSummary: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  issues: {
    issueSeq: number;
    typeKo: string;
    severity: string;
    filePath: string;
    lineNumber: number;
    message: string;
  }[];
}

export default function EnhancedScanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ScanTabMode>("file");

  const [selectedProfile, setSelectedProfile] = useState("security_core");
  const [useSbom, setUseSbom] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [pastedCode, setPastedCode] = useState("");
  const [virtualFilename, setVirtualFilename] = useState(
    "vulnerable_snippet.py",
  );

  // 💡 2. 스캔 결과를 담을 상태 추가
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setScanResult(null); // 파일이 변경되면 기존 결과 초기화
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      setScanResult(null);
    }
  };

  const handleExecuteScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanResult(null); // 새 스캔 시작 시 기존 결과 지우기

    try {
      let response;

      if (activeTab === "file") {
        if (selectedFiles.length === 0)
          return alert("스캔할 파일을 선택해주세요.");
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("files", file));
        formData.append("profile", selectedProfile);
        formData.append("generate_sbom", String(useSbom));

        response = await api.post("/scans/run-upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        if (!pastedCode.trim())
          return alert("분석할 코드 내용을 입력해주세요.");
        response = await api.post("/scans/run-code", {
          code: pastedCode,
          filename: virtualFilename || "snippet.py",
          profile: selectedProfile,
        });
      }

      // 💡 3. 성공 시 응답 데이터를 상태에 저장하여 화면 렌더링 트리거
      setScanResult(response.data);
    } catch (error: any) {
      console.error("Scan Request Failed:", error);
      alert("스캔 수행 중 오류가 발생했습니다.");
    } finally {
      setIsScanning(false);
    }
  };

  // 심각도 컬러맵
  const severityColors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    LOW: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* --- 기존 스캔 설정 및 입력 영역 --- */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            다중 차원 보안 소스코드 스캔
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            원하는 코드를 직접 입력하거나 패키지 아카이브 파일을 업로드하여 정적
            웹 취약점 분석 엔진을 실시간 구동합니다.
          </p>
        </div>

        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === "file" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            📁 파일 업로드
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === "code" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            💻 코드 직접 입력
          </button>
        </div>

        <form onSubmit={handleExecuteScan} className="space-y-6">
          {activeTab === "file" ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/50 hover:border-blue-400"}`}
            >
              <input
                type="file"
                id="multi-file-picker"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <label
                htmlFor="multi-file-picker"
                className="cursor-pointer block"
              >
                <div
                  className={`text-5xl mb-4 transition-transform ${isDragging ? "scale-110" : ""}`}
                >
                  📁
                </div>
                {selectedFiles.length > 0 ? (
                  <div className="text-blue-600 font-bold text-base">
                    {selectedFiles[0].name} 포함 총 {selectedFiles.length}개
                    업로드 대기 중
                  </div>
                ) : (
                  <p className="text-slate-600 font-medium">
                    여러 파일을 드래그하거나 클릭하여 선택하세요
                  </p>
                )}
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                  가상 파일명 설정
                </label>
                <input
                  type="text"
                  value={virtualFilename}
                  onChange={(e) => setVirtualFilename(e.target.value)}
                  placeholder="snippet.py"
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                  소스코드
                </label>
                <textarea
                  value={pastedCode}
                  onChange={(e) => setPastedCode(e.target.value)}
                  className="w-full h-72 p-4 font-mono text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-slate-950 text-slate-100"
                  placeholder="// 코드를 입력하세요"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex gap-6 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  스캔 프로파일
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none"
                >
                  <option value="security_core">Core (CWE Top 25)</option>
                  <option value="full">Full Scan</option>
                </select>
              </div>
              {activeTab === "file" && (
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="opt-sbom"
                    checked={useSbom}
                    onChange={(e) => setUseSbom(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label
                    htmlFor="opt-sbom"
                    className="text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    📦 SBOM 연계 생성
                  </label>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {isScanning ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  스캔 중...
                </>
              ) : (
                "보안 스캔 시작"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 💡 4. 스캔 결과 표시 영역 (조건부 렌더링) */}
      {scanResult && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 결과 헤더 */}
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                스캔 분석 완료
              </h2>
              <p className="text-slate-400 text-sm mt-1 font-mono">
                ID: {scanResult.scanId} | Target: {scanResult.target} |
                소요시간: {scanResult.durationMs}ms
              </p>
            </div>
            <div className="flex gap-2">
              {/* 💡 이력 목록이나 상세 페이지로 이동할 수 있는 바로가기 제공 */}
              <button
                onClick={() => router.push(`/scans/${scanResult.scanId}`)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                상세 리포트 보기
              </button>
              {scanResult.sbomId && (
                <button
                  onClick={() => router.push(`/sboms/${scanResult.sbomId}`)}
                  className="px-4 py-2 bg-emerald-900 text-emerald-300 hover:bg-emerald-800 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  📦 SBOM 확인
                </button>
              )}
            </div>
          </div>

          {/* 위협 요약 카드 */}
          <div className="grid grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
            <div className="bg-white p-4 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Critical
              </div>
              <div className="text-3xl font-black text-red-600">
                {scanResult.issuesSummary.CRITICAL}
              </div>
            </div>
            <div className="bg-white p-4 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">
                High
              </div>
              <div className="text-3xl font-black text-orange-500">
                {scanResult.issuesSummary.HIGH}
              </div>
            </div>
            <div className="bg-white p-4 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Medium
              </div>
              <div className="text-3xl font-black text-amber-500">
                {scanResult.issuesSummary.MEDIUM}
              </div>
            </div>
            <div className="bg-white p-4 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Low
              </div>
              <div className="text-3xl font-black text-blue-500">
                {scanResult.issuesSummary.LOW}
              </div>
            </div>
          </div>

          {/* 상세 취약점 리스트 */}
          <div className="p-0">
            {scanResult.issues.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {scanResult.issues.map((issue) => (
                  <div
                    key={issue.issueSeq}
                    className="p-5 hover:bg-slate-50 flex gap-4 items-start"
                  >
                    <div
                      className={`px-2.5 py-1 rounded text-xs font-bold border ${severityColors[issue.severity] || "bg-slate-100 text-slate-700"}`}
                    >
                      {issue.severity}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {issue.typeKo}
                      </h4>
                      <p className="text-slate-600 mt-1 text-sm">
                        {issue.message}
                      </p>
                      <div className="mt-2 text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block">
                        {issue.filePath} : Line {issue.lineNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <ShieldAlert className="w-12 h-12 text-emerald-400 mb-3" />
                <h3 className="font-bold text-lg text-slate-700">
                  탐지된 보안 취약점이 없습니다.
                </h3>
                <p className="text-sm">입력하신 코드는 안전합니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
