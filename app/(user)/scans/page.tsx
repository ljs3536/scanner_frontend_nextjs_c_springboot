"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface ScanHistoryItem {
  scanId: string;
  target: string;
  policy: string;
  language: string;
  issuesCritical: number;
  issuesHigh: number;
  issuesMedium: number;
  issuesLow: number;
  startedAt: string;
  sbomId?: string | null; // sbom_id는 없을 수도 있으므로 ? 처리
}

export default function ScanHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/scans/history");
        setHistory(response.data);
      } catch (error) {
        console.error("이력 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">스캔 관리 이력</h1>
        <button
          onClick={() => router.push("/scan")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          + 새 스캔 시작
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                대상 프로젝트
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                상태
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                탐지 이슈
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                스캔 일시
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">
                상세 대시보드
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-slate-400"
                >
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-slate-400"
                >
                  스캔 이력이 없습니다.
                </td>
              </tr>
            ) : (
              history.map((scan) => (
                <tr
                  // 💡 2. key 값을 고유 식별자인 scan.scanId로 변경!
                  key={scan.scanId}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">
                      {/* 3. 변경된 필드명 적용 */}
                      {scan.target}
                    </div>
                    <div className="text-xs text-slate-400">{scan.scanId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      COMPLETED
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-rose-500">
                    {/* 💡 임시로 High 위험도 갯수를 표시. 총합이 필요하면 프론트에서 더하거나 백엔드에서 합산 필드를 내려줘야 합니다. */}
                    {scan.issuesHigh + scan.issuesCritical}건
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {/* 4. 날짜 필드명 변경 */}
                    {scan.startedAt
                      ? new Date(scan.startedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/scan/${scan.scanId}`)
                        }
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100"
                      >
                        취약점 리포트
                      </button>
                      {/* 5. sbomId 조건 렌더링 */}
                      {scan.sbomId && (
                        <button
                          onClick={() =>
                            router.push(`/dashboard/sbom/${scan.sbomId}`)
                          }
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded border border-emerald-200 hover:bg-emerald-100"
                        >
                          SBOM 대시보드
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
