"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  Download,
  AlertCircle,
} from "lucide-react";

interface FileDto {
  fileSeq: number;
  fileName: string;
}

interface InquiryDetail {
  inquirySeq: number;
  title: string;
  content: string;
  scanId: string | null;
  status: string;
  answerContent: string | null;
  answeredAt: string | null;
  createdAt: string;
  files: FileDto[] | null;
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inquirySeq = params.inquirySeq as string;

  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inquirySeq) return;
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/inquiries/${inquirySeq}`);
        setDetail(response.data);
      } catch (error) {
        console.error("상세 조회 실패:", error);
        alert("데이터를 불러오지 못했습니다.");
        router.push("/inquiry");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [inquirySeq, router]);

  if (loading)
    return (
      <div className="p-20 text-center text-slate-500">
        상세 정보를 불러오는 중입니다...
      </div>
    );
  if (!detail) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
      {/* 뒤로가기 및 상태 헤더 */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <button
          onClick={() => router.push("/inquiry")}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${detail.status === "CMPLT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
            >
              {detail.status === "CMPLT" ? "답변완료" : "접수대기"}
            </span>
            <span className="text-sm text-slate-400 font-mono">
              {new Date(detail.createdAt).toLocaleString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{detail.title}</h1>
        </div>
      </div>

      {/* 연동된 스캔 ID 표시 (있는 경우) */}
      {detail.scanId && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700">
            연동된 스캔 타겟 ID:
          </span>
          <span className="text-sm font-mono text-blue-700 bg-white px-2 py-1 rounded border border-blue-200">
            {detail.scanId}
          </span>
        </div>
      )}

      {/* 사용자가 작성한 문의 내용 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[250px]">
        <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans">
          {detail.content}
        </p>
      </div>

      {/* 첨부파일 영역 */}
      {detail.files && detail.files.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
            <Paperclip className="w-4 h-4" /> 첨부파일 목록
          </h4>
          <div className="flex flex-wrap gap-2">
            {detail.files.map((file) => (
              <div
                key={file.fileSeq}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm"
              >
                <span className="text-slate-600 font-medium">
                  {file.fileName}
                </span>
                <button className="text-blue-500 hover:text-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💡 관리자 답변 영역 (status가 CMPLT일 때만 노출) */}
      {detail.status === "CMPLT" && detail.answerContent && (
        <div className="mt-8 bg-slate-900 rounded-2xl shadow-md border border-slate-800 p-8 relative overflow-hidden">
          {/* 장식용 배경 아이콘 */}
          <ShieldCheck className="absolute -right-6 -top-6 w-32 h-32 text-slate-800/50" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">
                  인포비정보기술 통합 보안 관리자
                </h3>
                <p className="text-slate-400 text-xs font-mono">
                  {new Date(detail.answeredAt!).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {detail.answerContent}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
