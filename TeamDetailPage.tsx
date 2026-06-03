import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../supabaseClient"; // 🚨 프로젝트 구조에 맞게 경로 확인 필수!

interface TroubleshootingLog {
  id: string;
  author: string;
  status: "resolved" | "in-progress" | "reported";
  timestamp: string;
  problem: string;
  plan?: string;
  solution?: string;
}

interface ProjectFile {
  id: string;
  name: string;
  url: string;
}

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isProfessor, isStudent, user } = useAuth();
  
  // 모달 제어 상태들
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showStudentEvalModal, setShowStudentEvalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRetrospectiveModal, setShowRetrospectiveModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  
  // 🔗 수파베이스 DB 실시간 데이터 상태
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [troubleshootingLogs, setTroubleshootingLogs] = useState<TroubleshootingLog[]>([]);

  // 📝 트러블슈팅 입력 폼 상태
  const [problemInput, setProblemInput] = useState("");
  const [planInput, setPlanInput] = useState("");
  const [logAnon, setLogAnon] = useState(false);

  // 📂 파일 업로드 모달 및 드래그 앤 드롭 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const myName = isProfessor ? "성보경 교수님" : (user?.name ?? "류지원");

  // ==========================================
  // 📡 [수파베이스] 1. 데이터 실시간 조회 (Read)
  // ==========================================
  useEffect(() => {
    fetchFilesAndLogs();
  }, [id]);

  async function fetchFilesAndLogs() {
    // 산출물 목록 가져오기
    const { data: filesData } = await supabase
      .from("ProjectFiles")
      .select("*")
      .eq("team_id", id)
      .order("created_at", { ascending: false });
    
    if (filesData) setUploadedFiles(filesData);

    // 트러블슈팅 로그 가져오기
    const { data: logsData } = await supabase
      .from("TroubleshootingLogs")
      .select("*")
      .eq("team_id", id)
      .order("created_at", { ascending: false });

    if (logsData) {
      const formattedLogs = logsData.map((log: any) => ({
        id: String(log.id),
        author: log.author,
        status: log.status || "in-progress",
        timestamp: new Date(log.created_at).toLocaleString('ko-KR', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        problem: log.problem,
        plan: log.plan,
        solution: log.solution,
      }));
      setTroubleshootingLogs(formattedLogs);
    }
  }

  // ==========================================
  // 📡 [수파베이스] 2. 파일/링크 업로드 저장 (Create)
  // ==========================================
  const handleUploadFile = async () => {
    if (!uploadName) return alert("제목을 입력해주세요!");
    if (!selectedFile) return alert("파일을 드래그하여 첨부해주세요!");

    // 1. Storage에 파일 업로드
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${id}/${Math.random()}.${fileExt}`; // 팀ID 폴더에 랜덤 파일명 생성

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("team-files") // 아까 만든 버킷 이름
      .upload(fileName, selectedFile);

    if (uploadError) return alert("Storage 업로드 실패: " + uploadError.message);

    // 2. 업로드된 파일의 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from("team-files")
      .getPublicUrl(fileName);
    
    const fileUrl = publicUrlData.publicUrl;

    // 3. DB에 파일 정보와 URL 저장
    const { error: dbError } = await supabase.from("ProjectFiles").insert([
      { team_id: id, name: uploadName, url: fileUrl }
    ]);

    if (!dbError) {
      setShowUploadModal(false);
      setUploadName("");
      setUploadUrl("");
      setSelectedFile(null);
      fetchFilesAndLogs(); 
    } else {
      alert("DB 저장 실패: " + dbError.message);
    }
  };
  // ==========================================
  // 📡 [수파베이스] 3. 트러블슈팅 로그 저장 (Create)
  // ==========================================
  const handleSubmitLog = async () => {
    // 파일 업로드 핸들러
  const handleUploadFile = async () => {
    if (!uploadName) return alert("제목을 입력해주세요!");
    const { error } = await supabase.from("ProjectFiles").insert([{ team_id: id, name: uploadName, url: uploadUrl || "#" }]);
    if (!error) { 
        setShowUploadModal(false); setUploadName(""); setUploadUrl(""); setSelectedFile(null); fetchFilesAndLogs(); 
    } else { alert("업로드 실패: " + error.message); }
  };
    if (!problemInput) return alert("문제를 입력해주세요!");

    const { error } = await supabase.from("TroubleshootingLogs").insert([
      {
        team_id: id,
        author: logAnon ? "익명" : myName,
        problem: problemInput,
        plan: planInput,
        status: "in-progress"
      }
    ]);

    if (!error) {
      setProblemInput("");
      setPlanInput("");
      setLogAnon(false);
      fetchFilesAndLogs(); 
    } else {
      alert("기록 실패: " + error.message);
    }
  };

  // 피드백 데이터 및 로직
  const FEEDBACK_OPTIONS = ["참신해요", "퀄리티가 좋아요", "실용적이에요", "실제로 사용해보고 싶어요"];
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>(["참신해요", "실제로 사용해보고 싶어요"]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedbackCustomModal, setShowFeedbackCustomModal] = useState(false);
  const [customFeedbackText, setCustomFeedbackText] = useState("");
  const [customFeedbackDraft, setCustomFeedbackDraft] = useState("");

  const toggleFeedback = (label: string) => {
    setSelectedFeedbacks((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  // 채팅방 로직
  interface ChatMessage { id: string; sender: string; text: string; time: string; isMine: boolean; isAnon: boolean; }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatAnon, setChatAnon] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChatModal) chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChatModal]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setChatMessages((prev) => [
      ...prev,
      { id: `c${Date.now()}`, sender: chatAnon ? "익명" : myName, text, time: timeStr, isMine: true, isAnon: chatAnon }
    ]);
    setChatInput("");
  };

  // 모달 내부용 하드코딩 데이터 보존
  const [studentEvalInputs, setStudentEvalInputs] = useState<Record<string, string>>({ s1: "", s2: "", s3: "", s4: "" });
  const allStudents = [
    { id: "s1", name: "홍길동", contribution: 30, peerKeywords: ["다시 팀하고 싶어요", "디자인을 잘 해요"], peerComment: "역할을 잘 완수했습니다.", roles: ["DB 문제 해결", "프론트"] },
    { id: "s2", name: "류지원", contribution: 25, peerKeywords: ["다시 팀하고 싶어요", "끝까지 책임져요"], peerComment: "시간을 잘 지킵니다.", roles: ["DB 문제 해결", "백엔드"] }
  ];
  const GOOD_KEYWORDS = ["다시 팀하고 싶어요", "시간 약속을 잘 지켜요", "디자인을 잘 해요", "끝까지 책임감을 가지고 완성해요"];
  const BAD_KEYWORDS = ["연락을 잘 안봐요", "시간 약속을 잘 못지켜요", "참여도가 낮아요", "맡은 역할을 다 하지 않았어요"];
  const teammates = [{ id: "t1", name: "홍길동", contribution: 30 }, { id: "t2", name: "김철수", contribution: 30 }, { id: "t3", name: "최수민", contribution: 10 }];
  const [peerReviews, setPeerReviews] = useState<Record<string, { good: string[]; bad: string[]; comment: string; submitted: boolean }>>(
    Object.fromEntries(teammates.map((m) => [m.id, { good: [], bad: [], comment: "", submitted: false }]))
  );

  const toggleKeyword = (memberId: string, type: "good" | "bad", keyword: string) => {
    setPeerReviews((prev) => {
      const arr = prev[memberId][type];
      return {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [type]: arr.includes(keyword) ? arr.filter((k) => k !== keyword) : [...arr, keyword],
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <div className="container mx-auto px-4 py-8 max-w-[1504px]">
        
        {/* 헤더 */}
        <div className="mb-10">
          <Link to="/app/teams" className="text-[#155dfc] text-base font-medium hover:underline mb-4 inline-block">
            ← 뒤로가기
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-[30px] font-bold text-[#155dfc]">{id}조</h1>
            {isProfessor ? (
              <div className="flex gap-3">
                <button onClick={() => setShowStudentEvalModal(true)} className="bg-white border-2 border-[#155dfc] text-[#155dfc] px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-50 transition-colors">학생 평가</button>
                <button onClick={() => setShowEvalModal(true)} className="bg-[#155dfc] text-white px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-700 transition-colors">프로젝트 평가</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setShowPeerReviewModal(true)} className="bg-white border-2 border-[#155dfc] text-[#155dfc] px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-50 transition-colors">조원 평가</button>
                <button onClick={() => setShowRetrospectiveModal(true)} className="bg-[#155dfc] text-white px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-700 transition-colors">회고록 작성</button>
              </div>
            )}
          </div>
        </div>

        {/* AI 통합 진행상황 요약 */}
        <div className="bg-gradient-to-r from-[#bfd3ff] to-[#e8e9ff] border border-[#c6d2ff] rounded-[14px] p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#312c85] mb-2">✨ AI 통합 진행상황 요약</h3>
          <p className="text-sm text-[#372aac] leading-relaxed">
            아직 AI가 요약할 만큼의 충분한 데이터가 쌓이지 않았습니다.<br/>
            프로젝트 산출물과 트러블슈팅 로그를 기록하여 팀의 진행 상황을 트래킹해보세요!
          </p>
        </div>

        {/* 2열 메인 대시보드 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* 왼쪽 컬럼: 프로젝트 산출물 & 공간 */}
          <div className="bg-white rounded-[14px] shadow-md border border-[rgba(0,0,0,0.1)] p-5 flex flex-col min-h-[400px]">
            <h2 className="text-lg font-bold text-[#1e2939] mb-6">📁 프로젝트 산출물 &amp; 공간</h2>

            <div className="flex-1 space-y-3 overflow-y-auto mb-4">
              {uploadedFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">아직 등록된 산출물이 없습니다.</div>
              ) : (
                uploadedFiles.map((file) => (
                  <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="bg-[#f9fafb] border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 flex items-center justify-between hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📄</span>
                      <span className="text-sm font-bold text-[#1e2939]">{file.name}</span>
                    </div>
                    <span className="text-xs text-[#155dfc] font-bold">열기 ↗</span>
                  </a>
                ))
              )}
            </div>

            {isStudent && (
              <button onClick={() => setShowUploadModal(true)} className="w-full bg-[#f9fafb] border border-dashed border-[#155dfc] rounded-[10px] py-4 text-[#155dfc] font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                + 링크 / 파일 업로드
              </button>
            )}

          </div>

          {/* 오른쪽 컬럼: 트러블슈팅 로그 피드 */}
          <div className="bg-white rounded-[14px] shadow-md border border-[rgba(0,0,0,0.1)] p-5 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#1c398e]">🛠️ 트러블슈팅 로그</h2>
              <span className="text-xs text-[#6a7282]">문제 해결 과정 및 피드백</span>
            </div>

            <div className="bg-[rgba(239,246,255,0.3)] border border-[#dbeafe] rounded-[10px] p-4 flex-1 flex flex-col justify-end space-y-4 overflow-y-auto">
              <div className="space-y-4 flex-1 overflow-y-auto mb-2">
                {troubleshootingLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">등록된 트러블슈팅 기록이 없습니다.</div>
                ) : (
                  troubleshootingLogs.map((log) => (
                    <div key={log.id} className="bg-white rounded-[10px] shadow-sm p-4 border border-[#e5e7eb]">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#fef9c2] border border-[#fff085] text-[#a65f00] text-[10px] font-bold px-2 py-1 rounded-full">🟡 해결 중</span>
                          <span className="text-xs font-bold text-[#1e2939]">{log.author}</span>
                        </div>
                        <span className="text-[10px] text-[#99a1af]">{log.timestamp}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-[#364153]"><span className="font-bold text-[#fb2c36]">🚨 문제:</span> {log.problem}</p>
                        {log.plan && <p className="text-xs text-[#364153]"><span className="font-bold text-[#2b7fff]">🏃 계획:</span> {log.plan}</p>}
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f3f4f6]">
                        <button onClick={() => setShowChatModal(true)} className="bg-[#155dfc] text-white text-xs font-bold px-4 py-2 rounded-[20px] hover:bg-blue-700 transition-colors">채팅방 이동</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isStudent && (
                <div className="bg-white border border-[#bedbff] rounded-[10px] p-4 shadow-sm flex-shrink-0">
                  <input type="text" value={problemInput} onChange={(e) => setProblemInput(e.target.value)} placeholder="🚨 어떤 문제(에러)를 겪고 있나요?" className="w-full bg-white border border-[#e5e7eb] rounded p-2.5 text-xs text-[#1e2939] placeholder:text-[rgba(30,41,57,0.5)] mb-3 outline-none focus:border-[#155dfc]" />
                  <input type="text" value={planInput} onChange={(e) => setPlanInput(e.target.value)} placeholder="🏃 원인을 어떻게 파악하고, 어떻게 해결할 계획인가요?" className="w-full bg-white border border-[#e5e7eb] rounded p-2.5 text-xs text-[#1e2939] placeholder:text-[rgba(30,41,57,0.5)] mb-4 outline-none focus:border-[#155dfc]" />
                  <div className="flex justify-between items-center px-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#6a7282] cursor-pointer select-none">
                      <input type="checkbox" className="w-4 h-4 accent-[#0f172a]" checked={logAnon} onChange={(e) => setLogAnon(e.target.checked)} />
                      <span>익명</span>
                    </label>
                    <button onClick={handleSubmitLog} className="bg-[#0f172a] text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm">기록 남기기</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 최하단 만족도 피드백 설문 블록 */}
        <div className="bg-white rounded-[14px] border border-[rgba(0,0,0,0.1)] shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-[#1e2939] text-center mb-2">이 팀의 웹 서비스, 어떻게 생각하시나요?</h3>
          <p className="text-sm text-[#6a7282] text-center mb-6">배포된 링크를 확인해 보고, 피드백을 남겨주세요.</p>

          {feedbackSubmitted ? (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">✅</span>
                <p className="text-base font-bold text-[#1e2939]">피드백이 완료되었습니다!</p>
                <p className="text-sm text-[#6a7282]">소중한 의견 감사합니다.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[...selectedFeedbacks, ...(customFeedbackText ? [`"${customFeedbackText}"`] : [])].map((label) => (
                  <span key={label} className="bg-[#eff6ff] border border-[#bedbff] text-[#1c398e] text-sm px-4 py-1.5 rounded-[14px] font-medium">{label}</span>
                ))}
              </div>
              <button onClick={() => { setFeedbackSubmitted(false); setCustomFeedbackText(""); setCustomFeedbackDraft(""); }} className="mt-2 bg-white border border-gray-300 text-[#364153] px-8 py-2 rounded-[14px] font-medium text-sm hover:bg-gray-50 transition-colors">🔄 피드백 다시하기</button>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-3 flex-wrap mb-4">
                {FEEDBACK_OPTIONS.map((option) => (
                  <button key={option} className={`${selectedFeedbacks.includes(option) ? "bg-[#155dfc] text-white border-[#155dfc]" : "bg-white text-[#364153] border-[rgba(0,0,0,0.1)]"} px-6 py-2 rounded-[14px] border font-medium hover:opacity-90 transition-all`} onClick={() => toggleFeedback(option)}>{option}</button>
                ))}
                <button className={`${customFeedbackText ? "bg-[#155dfc] text-white border-[#155dfc]" : "bg-white text-[#848484] border-[rgba(0,0,0,0.1)]"} px-6 py-2 rounded-[14px] border font-medium hover:opacity-90 transition-all`} onClick={() => { setCustomFeedbackDraft(customFeedbackText); setShowFeedbackCustomModal(true); }}>
                  {customFeedbackText ? `"${customFeedbackText}"` : "| 기타 입력"}
                </button>
              </div>
              <div className="flex justify-center">
                <button disabled={selectedFeedbacks.length === 0 && !customFeedbackText} className="bg-black disabled:bg-gray-400 text-white px-8 py-2 rounded-[14px] border border-[rgba(0,0,0,0.1)] font-medium hover:bg-gray-800 transition-colors" onClick={() => setFeedbackSubmitted(true)}>완료</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
          🚪 모달 팝업 레이어 정의부
         ========================================== */}

      {/* 1. 드래그 앤 드롭 파일/링크 업로드 모달 */}
      {/* 아래 코드를 기존 모달 정의부의 맨 끝에 추가하세요 */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-[rgba(79,79,79,0.83)] flex items-center justify-center z-50 p-4" onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}>
            <div className="bg-white rounded-[14px] shadow-2xl max-w-[500px] w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-black mb-4">링크 / 파일 등록</h2>
              
              <div className="space-y-4 mb-6">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const file = e.dataTransfer.files[0];
                      setSelectedFile(file);
                      setUploadName(file.name); 
                    }
                  }}
                  className={`border-2 border-dashed p-10 text-center rounded-[10px] transition-colors duration-200 ${
                    isDragging ? "border-[#155dfc] bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <p className="text-sm font-bold text-gray-700">이곳에 파일을 드래그 앤 드롭 하세요</p>
                  {selectedFile && <p className="text-[#155dfc] font-bold mt-2 text-xs">{selectedFile.name}</p>}
                </div>

                <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="제목 (파일명)" className="w-full border border-gray-300 rounded-[10px] p-3 text-sm outline-none" />
                <input type="text" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} disabled={!!selectedFile} placeholder={selectedFile ? "파일이 첨부되었습니다." : "URL (링크)"} className="w-full border border-gray-300 rounded-[10px] p-3 text-sm outline-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} className="flex-1 py-3 bg-gray-100 font-bold rounded-[10px]">취소</button>
                <button onClick={handleUploadFile} className="flex-1 py-3 bg-[#155dfc] text-white font-bold rounded-[10px]">등록하기</button>
              </div>
            </div>
          </div>
        )}
      {/* 2. 대화 실시간 채팅 모달 */}
      {showChatModal && (
        <div className="fixed inset-0 bg-[rgba(79,79,79,0.83)] flex items-center justify-center z-50 p-4" onClick={() => setShowChatModal(false)}>
          <div className="bg-white rounded-[14px] shadow-2xl max-w-[680px] w-full flex flex-col" style={{ height: "min(720px, 90vh)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[14px] flex-shrink-0">
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full"></span><h2 className="text-base font-bold text-black">채팅방</h2></div>
              <button onClick={() => setShowChatModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-[#f9fafb]">
              {chatMessages.map((msg) =>
                msg.isMine ? (
                  <div key={msg.id} className="flex flex-col items-end"><p className="text-xs font-medium text-[#6a7282] mb-1">{msg.sender}</p><div className="bg-[#155dfc] rounded-[14px] rounded-tr-[4px] px-4 py-2.5 max-w-[80%] shadow-sm"><p className="text-sm text-white leading-relaxed break-words">{msg.text}</p></div><p className="text-[10px] text-[#b0b8c1] mt-1">{msg.time}</p></div>
                ) : (
                  <div key={msg.id} className="flex flex-col items-start"><p className="text-xs font-medium text-black mb-1">{msg.sender}</p><div className="bg-white border border-[#e5e7eb] rounded-[14px] rounded-tl-[4px] px-4 py-2.5 max-w-[80%] shadow-sm"><p className="text-sm text-black leading-relaxed break-words">{msg.text}</p></div><p className="text-[10px] text-[#b0b8c1] mt-1">{msg.time}</p></div>
                )
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="px-5 py-4 border-t border-gray-200 bg-white rounded-b-[14px] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <label className="flex items-center gap-1.5 text-xs text-[#6a7282] cursor-pointer select-none"><input type="checkbox" className="w-3.5 h-3.5 accent-[#155dfc]" checked={chatAnon} onChange={(e) => setChatAnon(e.target.checked)} />익명</label>
                <div className="flex-1 bg-[#f3f4f6] rounded-full px-4 py-2 flex items-center gap-2">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="메시지를 입력하세요." className="flex-1 bg-transparent text-sm text-[#1e2939] placeholder:text-[#9d9d9d] outline-none" />
                </div>
                <button onClick={sendChat} disabled={!chatInput.trim()} className="bg-[#155dfc] disabled:bg-[#c7d9f8] text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-700 shadow-sm">전송</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 교수 전용 프로젝트 평가 모달 */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-[rgba(79,79,79,0.81)] flex items-center justify-center z-50 p-4" onClick={() => setShowEvalModal(false)}>
          <div className="bg-white rounded-[10px] shadow-2xl max-w-[1191px] w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-[25px] font-bold text-black">학생 및 프로젝트 평가</h2>
              <button onClick={() => setShowEvalModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full text-xl font-bold">✕</button>
            </div>
            <div className="px-16 py-12 space-y-8">
              <div className="space-y-4">
                <h3 className="text-[25px] font-medium text-center">작업 완성도</h3>
                <div className="bg-[#eff6ff] rounded-[10px] p-4">
                  <div className="bg-white rounded p-4 mb-4"><p className="text-[17px]">코드 및 웹 사이트 보러 가기</p></div>
                  <div className="bg-white rounded p-4"><textarea placeholder="평가를 입력하세요." className="w-full h-[96px] outline-none resize-none" /></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[25px] font-medium text-center">문제 해결력</h3>
                <div className="bg-[#eff6ff] rounded-[10px] p-4">
                  <div className="bg-white rounded p-4 mb-4"><p className="text-[17px]">문제 해결 목록: DB문제 해결, 서버 구동 문제 해결</p></div>
                  <div className="bg-white rounded p-4"><textarea placeholder="평가를 입력하세요." className="w-full h-[98px] outline-none resize-none" /></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[25px] font-medium text-center">총체적 평가</h3>
                <div className="bg-[#eff6ff] rounded-[10px] p-4">
                  <div className="bg-white rounded p-4"><textarea placeholder="평가를 입력하세요." className="w-full h-[333px] outline-none resize-none" /></div>
                </div>
              </div>
              <div className="flex justify-center pt-6"><button onClick={() => setShowEvalModal(false)} className="bg-[#155dfc] text-white px-8 py-2 rounded-[10px] font-bold">완료</button></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 교수 전용 학생 평가 모달 */}
      {showStudentEvalModal && (
        <div className="fixed inset-0 bg-[rgba(79,79,79,0.81)] flex items-center justify-center z-50 p-4" onClick={() => setShowStudentEvalModal(false)}>
          <div className="bg-white rounded-[10px] shadow-2xl max-w-[780px] w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-lg font-bold text-black">학생 및 프로젝트 평가</h2>
              <button onClick={() => setShowStudentEvalModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full text-xl font-bold">✕</button>
            </div>
            <div className="px-6 py-5 space-y-7">
              {allStudents.map((student) => (
                <div key={student.id} className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-base font-medium">{student.name}</span><span className="text-base font-medium">평균 기여도 : <span className="text-[#155dfc] font-bold">{student.contribution}%</span></span></div>
                  <div className="bg-[#eff6ff] rounded-[10px] p-4 space-y-3">
                    <p className="text-sm font-medium">역할 및 동료평가 - 참고</p>
                    <div className="bg-white border rounded-[10px] p-3">
                      <div className="flex flex-wrap gap-1.5">{student.peerKeywords.map((kw) => (<span key={kw} className="bg-[#155dfc] text-white text-xs px-3 py-1.5 rounded-[10px]">{kw}</span>))}<span className="bg-white border text-xs px-3 py-1.5 rounded-[10px]">{student.peerComment}</span></div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-[10px] p-3"><textarea value={studentEvalInputs[student.id]} onChange={(e) => setStudentEvalInputs((prev) => ({ ...prev, [student.id]: e.target.value }))} placeholder="평가를 입력하세요." rows={2} className="w-full text-sm outline-none resize-none" /></div>
                </div>
              ))}
              <div className="flex justify-center pt-2"><button onClick={() => setShowStudentEvalModal(false)} className="bg-[#155dfc] text-white px-16 py-2.5 rounded-full font-bold shadow-md">다음</button></div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 학생 전용 회고록 작성 모달 */}
      {showRetrospectiveModal && (
        <div className="fixed inset-0 bg-[rgba(79,79,79,0.83)] flex items-center justify-center z-50 p-4" onClick={() => setShowRetrospectiveModal(false)}>
          <div className="bg-white rounded-[10px] shadow-2xl max-w-[1191px] w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-[25px] font-bold text-black">회고록</h2>
              <button onClick={() => setShowRetrospectiveModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full text-xl font-bold">✕</button>
            </div>
            <div className="px-16 py-6 space-y-8">
              {["본인이 한 역할", "잘한점", "아쉬운 점", "발전한 점"].map((title) => (
                <div key={title} className="bg-[#eff6ff] rounded-[10px] p-6">
                  <p className="text-[20px] font-medium text-center mb-4">{title}</p>
                  <div className="bg-white rounded p-4 mb-4 shadow-sm"><p className="text-[17px] font-bold text-gray-500 mb-1">자동연동</p><p className="text-[17px] text-gray-800">연동 대기 중...</p></div>
                  <div className="bg-white rounded p-4 shadow-sm"><p className="text-[17px] font-bold text-gray-500 mb-2">직접입력</p><input type="text" placeholder="직접 입력하세요." className="w-full text-[17px] outline-none" /></div>
                </div>
              ))}
              <div className="flex justify-center pt-6"><button onClick={() => setShowRetrospectiveModal(false)} className="bg-[#155dfc] text-white px-16 py-2 rounded-[10px] text-[17px] font-bold">완료</button></div>
            </div>
          </div>
        </div>
      )}

      {/* 6. 학생 전용 동료평가 모달 */}
      {showPeerReviewModal && (
        <div className="fixed inset-0 bg-[rgba(79,79,79,0.83)] flex items-center justify-center z-50 p-4" onClick={() => setShowPeerReviewModal(false)}>
          <div className="bg-white rounded-[10px] shadow-2xl max-w-[780px] w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-lg font-bold text-black">동료평가</h2>
              <button onClick={() => setShowPeerReviewModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full text-xl font-bold">✕</button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-base font-medium">류지원<span className="text-gray-400 text-sm ml-1">(본인)</span></span><span className="text-base font-medium">기여도 : <span className="text-[#155dfc] font-bold">30%</span></span></div>
              {teammates.map((member) => {
                const review = peerReviews[member.id];
                return (
                  <div key={member.id} className="space-y-3">
                    <div className="flex items-center justify-between"><span className="text-base font-medium">{member.name}</span><span className="text-base font-medium">기여도 : <span className="text-[#155dfc] font-bold">{member.contribution}%</span></span></div>
                    <div className="bg-[#eff6ff] rounded-[10px] p-4 space-y-3">
                      <p className="text-sm font-medium">키워드 등록</p>
                      <div className="bg-white border border-blue-200 rounded-[10px] p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><p className="text-xs font-bold mb-2">좋아요</p><div className="flex flex-wrap gap-1">{GOOD_KEYWORDS.map((kw) => (<button key={kw} onClick={() => toggleKeyword(member.id, "good", kw)} className={`text-[11px] px-2.5 py-1 rounded-full border ${review.good.includes(kw) ? "bg-[#155dfc] text-white" : "bg-white text-gray-600"}`}>{kw}</button>))}</div></div>
                          <div><p className="text-xs font-bold mb-2">아쉬워요</p><div className="flex flex-wrap gap-1">{BAD_KEYWORDS.map((kw) => (<button key={kw} onClick={() => toggleKeyword(member.id, "bad", kw)} className={`text-[11px] px-2.5 py-1 rounded-full border ${review.bad.includes(kw) ? "bg-[#155dfc] text-white" : "bg-white text-gray-600"}`}>{kw}</button>))}</div></div>
                        </div>
                      </div>
                      <div className="flex justify-center"><button onClick={() => setPeerReviews((prev) => ({ ...prev, [member.id]: { ...prev[member.id], submitted: true } }))} className={`px-6 py-1.5 rounded-full text-xs font-bold ${review.submitted ? "bg-green-500 text-white" : "bg-[#155dfc] text-white"}`}>{review.submitted ? "✓ 등록됨" : "등록 완료"}</button></div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-[10px] px-4 py-2.5"><input type="text" value={review.comment} onChange={(e) => setPeerReviews((prev) => ({ ...prev, [member.id]: { ...prev[member.id], comment: e.target.value } }))} placeholder="한줄 코멘트를 작성하세요" className="w-full text-sm outline-none" /></div>
                  </div>
                );
              })}
              <div className="flex justify-center pt-2"><button onClick={() => setShowPeerReviewModal(false)} className="bg-[#155dfc] text-white px-16 py-2.5 rounded-full font-bold shadow-md">다음</button></div>
            </div>
          </div>
        </div>
      )}

      {/* 7. 피드백 주관식 텍스트 입력 모달 */}
      {showFeedbackCustomModal && (
        <div className="fixed inset-0 bg-[rgba(79,79,79,0.83)] flex items-center justify-center z-50 p-4" onClick={() => setShowFeedbackCustomModal(false)}>
          <div className="bg-white rounded-[10px] shadow-2xl max-w-[500px] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 z-10"><h2 className="text-lg font-bold text-black">피드백 작성</h2><button onClick={() => setShowFeedbackCustomModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full text-xl font-bold">✕</button></div>
            <div className="px-6 py-5 space-y-6">
              <div className="bg-white border border-gray-200 rounded-[10px] px-4 py-3"><textarea value={customFeedbackDraft} onChange={(e) => setCustomFeedbackDraft(e.target.value)} placeholder="피드백을 입력하세요." rows={4} className="w-full text-sm outline-none resize-none" /></div>
              <div className="flex justify-center pt-2 pb-2"><button onClick={() => { setCustomFeedbackText(customFeedbackDraft); setShowFeedbackCustomModal(false); }} className="bg-[#155dfc] text-white px-16 py-2.5 rounded-full text-sm font-bold">등록</button></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}