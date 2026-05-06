import { useState, useEffect } from 'react';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0c7LJmkNap67_snwfAlMCnwf6daus14k",
  authDomain: "awesome-69d30.firebaseapp.com",
  projectId: "awesome-69d30",
  storageBucket: "awesome-69d30.firebasestorage.app",
  messagingSenderId: "306370177530",
  appId: "1:306370177530:web:1a93a7d09b61c92a6d1c43",
  measurementId: "G-BJ6YXMK8QF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);



interface Classmate {
  id: number;
  name: string;
  major: string;
  initial: string;
  tags: string[];
  intro: string;
  portfolio: string;
  aspiration: string;
  profileImage?: string;
}

interface Team {
  id: number;
  name: string;
  topic: string;
  status: string;
  bg: string;
  members: string[];
  progress: number;
  aggroType: 'flex' | 'help' | 'normal';
  aggroMessage: string;
}

interface QnA {
  id: number;
  title: string;
  author: string;
  views: number;
  likes: number;
  content: string;
}

interface Class {
  id: number;
  name: string;
  professor: string;
  schedule: string;
  room: string;
  credits: number;
  semester: string;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<'login' | 'signup' | 'authed'>('login');
  const [activeTab, setActiveTab] = useState<'team' | 'classmates' | 'qna' | 'mypage' | 'myteam' | 'classes'>('team');
  const [showPopularModal, setShowPopularModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQnaModal, setShowQnaModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showWriteQnaModal, setShowWriteQnaModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showTeamDetail, setShowTeamDetail] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Classmate | null>(null);
  const [selectedQna, setSelectedQna] = useState<QnA | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showClassDetail, setShowClassDetail] = useState(false);
  const [teamTabVisited, setTeamTabVisited] = useState(false);

  const [myProfileMajor, setMyProfileMajor] = useState('벤처중소기업학 / 글로벌미디어 복수전공');
  const [myProfileTags, setMyProfileTags] = useState(['기획/디자인', '기아타이거즈', 'TFT']);
  const [mypageView, setMypageView] = useState<'report' | 'info'>('report');

  const [classmates] = useState<Classmate[]>([
    { id: 0, name: "류지원 (나)", major: "벤처중소기업학 / 글로벌미디어 복수전공", initial: "류", tags: ["기획/디자인", "기아타이거즈", "TFT"], intro: "웹개발 수업을 통해 실무 경험을 쌓고 싶습니다. 팀 프로젝트에서 적극적으로 협업하며 성장하겠습니다.", portfolio: "류지원_포트폴리오.pdf", aspiration: "이번 프로젝트에서 개발 역할을 하고 싶습니다!" },
    { id: 1, name: "김철수", major: "시각디자인과", initial: "김", tags: ["UI/UX", "피그마", "퍼블리싱", "HTML/CSS", "JavaScript", "일러스트레이팅 좋아합니다", "프로토타이핑"], intro: "UI/UX 디자이너 겸 프론트 퍼블리셔입니다. 피그마 활용과 CSS 애니메이션 구현에 자신 있습니다.", portfolio: "김철수_포트폴리오_2026.pdf", aspiration: "UI/UX 중심의 프론트엔드 개발을 맡고 싶습니다!", profileImage: "https://picsum.photos/seed/kim/200/200" },
    { id: 2, name: "이영희", major: "소프트웨어학", initial: "이", tags: ["백엔드", "Node.js", "서버배포", "Express", "MongoDB", "REST API", "AWS"], intro: "백엔드 개발자입니다. Node.js와 AWS EC2 배포 경험이 있습니다. 안정적인 API 서버 구축을 목표로 합니다.", portfolio: "이영희_Github_링크.pdf", aspiration: "안정적인 백엔드 API 서버 구축을 담당하겠습니다!" },
    { id: 3, name: "박지성", major: "경영학과", initial: "박", tags: ["PM", "기획", "QA", "애자일", "축구 보는거 좋아해요", "문서화", "일정관리"], intro: "웹 서비스 기획 및 PM을 맡고 싶습니다. 유저 스토리 작성과 일정 관리, 꼼꼼한 테스트를 담당하겠습니다.", portfolio: "박지성_기획서모음.pptx", aspiration: "프로젝트 전체 일정 관리와 QA를 책임지겠습니다!" },
    { id: 4, name: "최수민", major: "글로벌미디어", initial: "최", tags: ["React", "프론트엔드", "인터랙션", "TypeScript", "음원작업 합니다", "상태관리", "Redux"], intro: "React를 활용한 동적인 웹 애플리케이션 개발을 좋아합니다. 상태 관리와 컴포넌트 설계에 관심이 많습니다.", portfolio: "수민_프로젝트_깃허브.pdf", aspiration: "React로 사용자 경험이 좋은 UI를 만들고 싶어요!", profileImage: "https://picsum.photos/seed/choi/200/200" },
    { id: 5, name: "정다은", major: "통계학과", initial: "정", tags: ["데이터베이스", "SQL", "파이썬", "PostgreSQL", "사진촬영 좋아합니다", "ERD설계"], intro: "데이터베이스 모델링과 SQL 쿼리 최적화에 관심이 많습니다. 백엔드 팀원과 협업하여 효율적인 DB를 구축하고 싶습니다.", portfolio: "DB_설계_프로젝트.pdf", aspiration: "효율적인 데이터베이스 설계와 최적화를 맡겠습니다!" },
    { id: 6, name: "강동원", major: "벤처중소기업학", initial: "강", tags: ["창업", "비즈니스모델", "발표", "마케팅", "베이킹 취미입니다", "투자유치"], intro: "개발된 웹 서비스의 수익 모델을 검증하고, 최종 프로젝트 발표를 전담하고 싶습니다.", portfolio: "창업아이템_기획.pptx", aspiration: "서비스의 비즈니스 모델 검증과 발표를 담당하겠습니다!", profileImage: "https://picsum.photos/seed/kang/200/200" }
  ]);

  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: "1조", topic: "캠퍼스 카풀 웹서비스", status: "배포 완료", bg: "bg-blue-50", members: ["김", "이", "박"], progress: 95, aggroType: "flex", aggroMessage: "🚀 우리 폼 미쳤다! 구경와!" },
    { id: 2, name: "2조", topic: "AI 학식 메뉴 추천", status: "프론트엔드 개발중", bg: "bg-green-50", members: ["최", "정"], progress: 40, aggroType: "help", aggroMessage: "🆘 제발 살려주세요... CORS 지옥" },
    { id: 3, name: "3조", topic: "중고 전공책 거래 커뮤니티", status: "API 연동중", bg: "bg-yellow-50", members: ["강", "김"], progress: 65, aggroType: "normal", aggroMessage: "" },
    { id: 4, name: "4조", topic: "스터디 매칭 시스템", status: "테스트 중", bg: "bg-purple-50", members: ["이", "박", "최"], progress: 80, aggroType: "normal", aggroMessage: "" },
    { id: 5, name: "5조", topic: "유학생 튜터링 플랫폼", status: "DB 설계중", bg: "bg-red-50", members: ["정", "강"], progress: 20, aggroType: "help", aggroMessage: "💧 DB 구조 좀 봐주실 천사 구함" }
  ]);

  const [classes] = useState<Class[]>([
    { id: 1, name: "웹프로그래밍", professor: "세종대왕", schedule: "월 13:00-15:00, 수 13:00-15:00", room: "공학관 301호", credits: 3, semester: "2026-1" },
    { id: 2, name: "데이터베이스 설계", professor: "이순신", schedule: "화 10:00-12:00, 목 10:00-12:00", room: "공학관 205호", credits: 3, semester: "2026-1" },
    { id: 3, name: "소프트웨어공학", professor: "장영실", schedule: "금 14:00-17:00", room: "IT관 402호", credits: 3, semester: "2026-1" }
  ]);

  const [qnaData, setQnaData] = useState<QnA[]>([
    { id: 1, title: "혹시 캐릭터 일러스트레이션 하시는 분 계시나요?", author: "김철수", views: 245, likes: 62, content: "팀 프로젝트에 들어갈 캐릭터 디자인이 필요한데, 혹시 일러스트레이션 작업 가능하신 분 계실까요? 간단한 SD 캐릭터 3-4개 정도 필요합니다!" },
    { id: 2, title: "음반 작업 가능하신분 찾습니다 ㅠㅜ", author: "최수민", views: 189, likes: 48, content: "웹사이트에 들어갈 배경음악이랑 효과음을 직접 제작하고 싶은데, 음원 작업 경험 있으신 분 계시면 같이 작업하실 수 있을까요? 30초 정도의 짧은 루프 음악입니다." },
    { id: 3, title: "직접 만든 db api뿌립니다. 고성능입니다.", author: "이영희", views: 412, likes: 95, content: "Node.js + PostgreSQL로 RESTful API 서버 구축했습니다. 응답속도 평균 50ms 이하로 최적화했고, 인증/권한 관리 포함되어 있습니다. 필요하신 분들 공유 드릴게요!" },
    { id: 4, title: "React 상태관리 Redux vs Zustand?", author: "박지성", views: 156, likes: 31, content: "중규모 프로젝트인데 상태관리 라이브러리 선택에 고민중입니다. Redux가 안정적이라고는 하는데 보일러플레이트가 많아서요. Zustand 써보신 분 계신가요?" },
    { id: 5, title: "Git 브랜치 전략 추천 부탁드립니다", author: "정다은", views: 98, likes: 18, content: "5명이서 협업하는데 Git Flow vs GitHub Flow 중 뭐가 나을까요? 브랜치 관리가 처음이라 혼란스럽네요 ㅠㅠ" },
    { id: 6, title: "Figma 디자인 파일 코드 변환 툴", author: "강동원", views: 203, likes: 44, content: "Figma에서 디자인한 UI를 HTML/CSS로 변환해주는 좋은 툴 있을까요? 수작업으로 하기엔 시간이 너무 오래 걸려서요." },
    { id: 7, title: "웹 성능 최적화 팁 공유합니다", author: "김철수", views: 167, likes: 52, content: "Lighthouse 점수 95점 이상 받았습니다! 이미지 lazy loading, 코드 스플리팅, CDN 활용 등 제가 적용한 방법들 공유드릴게요." }
  ]);
  // 팀 탭 처음 방문 시 인기 프로젝트 모달 자동으로 띄워주는 함수
  useEffect(() => {
    if (!teamTabVisited) {
      setShowPopularModal(true);
      setTeamTabVisited(true);
    }
  }, [teamTabVisited]);

  const circleColors = ['bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400'];

  const changeTab = (tabId: 'team' | 'classmates' | 'qna' | 'mypage' | 'myteam' | 'classes') => {
    setActiveTab(tabId);
    if (tabId === 'team' && !teamTabVisited) {
      setShowPopularModal(true);
      setTeamTabVisited(true);
    }
  };

  const openProfile = (id: number) => {
    const student = classmates.find(c => c.id === id);
    if (student) {
      setSelectedProfile(student);
      setShowProfileModal(true);
    }
  };

  const openQnaDetail = (id: number) => {
    const qna = qnaData.find(q => q.id === id);
    if (qna) {
      qna.views++;
      setSelectedQna(qna);
      setShowQnaModal(true);
      setQnaData([...qnaData]);
    }
  };

  const likeCurrentQna = () => {
    if (selectedQna) {
      selectedQna.likes++;
      setQnaData([...qnaData]);
    }
  };

  const openTeamDetail = (teamName: string) => {
    setSelectedTeamName(teamName);
    setShowTeamDetail(true);
    setShowPopularModal(false);
  };

  const submitQna = (title: string, content: string) => {
    if (title.trim() === "" || content.trim() === "") {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    const newId = Math.max(...qnaData.map(q => q.id)) + 1;
    setQnaData([...qnaData, {
      id: newId,
      title,
      author: "류지원 (나)",
      views: 0,
      likes: 0,
      content
    }]);

    alert('질문이 성공적으로 등록되었습니다.');
    setShowWriteQnaModal(false);
  };

  const submitCreateTeam = (name: string, topic: string, members: string[]) => {
    if (name.trim() === "" || topic.trim() === "") {
      alert("팀명과 주제를 모두 입력해주세요.");
      return;
    }

    const newId = Math.max(...teams.map(t => t.id)) + 1;
    const bgColors = ["bg-blue-50", "bg-green-50", "bg-yellow-50", "bg-purple-50", "bg-red-50", "bg-indigo-50", "bg-pink-50"];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

    setTeams([...teams, {
      id: newId,
      name,
      topic,
      status: "팀 빌딩중",
      bg: randomBg,
      members: ['나', ...members],
      progress: 0,
      aggroType: "normal",
      aggroMessage: ""
    }]);

    alert(name + '이(가) 성공적으로 생성되었습니다!');
    setShowCreateTeamModal(false);
  };

  const saveProfile = (major: string, careerTags: string, hobbiesTags: string) => {
    setMyProfileMajor(major);
    const combined = (careerTags + "," + hobbiesTags)
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== "");
    setMyProfileTags(combined);
    alert('정보가 성공적으로 저장되었습니다.');
    setShowEditProfileModal(false);
  };

  const sortedQna = [...qnaData].sort((a, b) => b.likes - a.likes || b.views - a.views);

  const handleSignup = (event: React.FormEvent) => {
    event.preventDefault(); // 폼 제출 방지

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up 
        const user = userCredential.user;
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });

    // 이제 getElementById 없이도 email, password 변수를 바로 쓸 수 있어요!
    console.log("이메일:", email);
    console.log("비밀번호:", password);
  };

  const auth = getAuth();

  const handleSignin = (event: React.FormEvent) => {
    event.preventDefault(); // 폼 제출 방지

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        // ...
        setIsLoggedIn('authed'); // 로그인 성공 시 상태 변경
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });

    // 이제 getElementById 없이도 email, password 변수를 바로 쓸 수 있어요!
    console.log("이메일:", email);
    console.log("비밀번호:", password);
  };



  //첫 방문시 로그인 안된 상태에서 보이는 화면
  if (isLoggedIn === 'login') {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

          <div className="absolute top-20 left-10 text-gray-400 text-9xl font-black opacity-30">WELCOME</div>
          <div className="absolute bottom-20 right-10 text-gray-400 text-9xl font-black opacity-30">환영합니다</div>

          <div className="absolute top-32 left-16 bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg w-56 fade-in">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-bold text-gray-800 mb-1">수강자 네트워크</h3>
              <p className="text-xs text-gray-600">팀원을 찾고 프로필 확인</p>
            </div>
          </div>

          <div className="absolute bottom-32 left-24 bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg w-56 fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-bold text-gray-800 mb-1">팀 프로젝트</h3>
              <p className="text-xs text-gray-600">진행상황 관리 및 공유</p>
            </div>
          </div>

          <div className="absolute top-40 right-20 bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg w-56 fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-bold text-gray-800 mb-1">Q&A 게시판</h3>
              <p className="text-xs text-gray-600">질문하고 답변 공유</p>
            </div>
          </div>
          {/* 로그인 폼 */}
          <form onSubmit={handleSignin}> {/* form에 onSubmit 연결 */}
            <div className="max-w-md w-full relative z-20">
              <div className="text-center mb-8 fade-in">
                <h1 className="text-5xl font-black text-gray-800 mb-2">CampusConnect</h1>
                <p className="text-gray-600">웹개발 수업 협업 플랫폼</p>
              </div>

              <div className="bg-white rounded-xl shadow-2xl p-8 fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                </div>


                <button
                  onClick={(e) => {
                    handleSignin(e);        // 1. 회원가입 로직 실행 // 2. 상태 변경 실행
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg mb-3"
                >
                  로그인
                </button>

                <button
                  // onClick={() => setIsLoggedIn('authed')}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition border-2 border-dashed border-gray-300"
                  title="개발용 임시 접속"
                >
                  (개발용임시로그인패스)
                </button>

                <div className="mt-6 text-center text-sm">
                  <a href="#" className="text-blue-600 hover:underline">비밀번호를 잊으셨나요?</a>
                  <span className="text-gray-400 mx-2">|</span>
                  <a href="#" onClick={(e) => {
                    e.preventDefault();   // 클릭 시 페이지가 새로고침되는 것을 방지
                    setIsLoggedIn('signup'); // 상태를 'signup'으로 변경하여 화면 전환 유도
                  }}
                    className="text-blue-600 hover:underline">회원가입</a>
                </div>
              </div>
            </div>
          </form>

          <style>{`
              .bg-grid-pattern {
                background-image:
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
                background-size: 40px 40px;
              }
            `}</style>
        </div>

        <footer className="bg-[#0f172a] text-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-white font-bold text-xl mb-4">CampusConnect</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  학생들의 팀 프로젝트 협업을 위한<br />
                  올인원 플랫폼
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">연락처</h4>
                <ul className="space-y-2 text-sm">
                  <li>📧 support@campusconnect.com</li>
                  <li>📞 02-1234-5678</li>
                  <li>📍 서울특별시 광진구 능동로 209</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">바로가기</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition">이용약관</a></li>
                  <li><a href="#" className="hover:text-white transition">개인정보처리방침</a></li>
                  <li><a href="#" className="hover:text-white transition">공지사항</a></li>
                  <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
              <p>© 2026 CampusConnect. All rights reserved.</p>
              <p className="mt-2">본 서비스는 교육 목적으로 제작된 프로젝트입니다.</p>
            </div>
          </div>
        </footer>
      </div>
    )
  }
  else if (isLoggedIn === 'signup') {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

          <div className="absolute top-20 left-10 text-gray-400 text-9xl font-black opacity-30">WELCOME</div>
          <div className="absolute bottom-20 right-10 text-gray-400 text-9xl font-black opacity-30">환영합니다</div>

          <div className="absolute top-32 left-16 bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg w-56 fade-in">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-bold text-gray-800 mb-1">수강자 네트워크</h3>
              <p className="text-xs text-gray-600">팀원을 찾고 프로필 확인</p>
            </div>
          </div>

          <div className="absolute bottom-32 left-24 bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg w-56 fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-bold text-gray-800 mb-1">팀 프로젝트</h3>
              <p className="text-xs text-gray-600">진행상황 관리 및 공유</p>
            </div>
          </div>

          <div className="absolute top-40 right-20 bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg w-56 fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-bold text-gray-800 mb-1">Q&A 게시판</h3>
              <p className="text-xs text-gray-600">질문하고 답변 공유</p>
            </div>
          </div>
          {/* 회원가입 폼 */}
          <form onSubmit={handleSignup}> {/* form에 onSubmit 연결 */}
            <div className="max-w-md w-full relative z-20">
              <div className="text-center mb-8 fade-in">
                <h1 className="text-5xl font-black text-gray-800 mb-2">CampusConnect</h1>
                <p className="text-gray-600">웹개발 수업 협업 플랫폼</p>
              </div>

              <div className="bg-white rounded-xl shadow-2xl p-8 fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      id="signupEmail"
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      id="signupPassword"
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    handleSignup(e);        // 1. 회원가입 로직 실행
                    setIsLoggedIn('login'); // 2. 상태 변경 실행
                  }}
                  id="SignupButton"
                  type="submit" // 버튼을 submit 타입으로 변경
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg mb-3"
                >
                  회원가입하기
                </button>
              </div>
            </div>
          </form>
          <style>{`
              .bg-grid-pattern {
                background-image:
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
                background-size: 40px 40px;
              }
            `}</style>
        </div>

        <footer className="bg-[#0f172a] text-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-white font-bold text-xl mb-4">CampusConnect</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  학생들의 팀 프로젝트 협업을 위한<br />
                  올인원 플랫폼
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">연락처</h4>
                <ul className="space-y-2 text-sm">
                  <li>📧 support@campusconnect.com</li>
                  <li>📞 02-1234-5678</li>
                  <li>📍 서울특별시 광진구 능동로 209</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">바로가기</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition">이용약관</a></li>
                  <li><a href="#" className="hover:text-white transition">개인정보처리방침</a></li>
                  <li><a href="#" className="hover:text-white transition">공지사항</a></li>
                  <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
              <p>© 2026 CampusConnect. All rights reserved.</p>
              <p className="mt-2">본 서비스는 교육 목적으로 제작된 프로젝트입니다.</p>
            </div>
          </div>
        </footer>
      </div>
    )
  };

  // 로그인 후 메인 화면 방출 부분
  return (
    //전체 페이지 감싸는 div
    <div className="bg-gray-50 text-gray-800 min-h-screen flex flex-col">
      // 전체 css
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
      `}</style>
      {/* 상단 네비게이션 바 */}
      <nav className="bg-[#0f172a] text-white shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="font-bold text-2xl tracking-wider text-blue-400">CampusConnect</div>
          <div className="flex items-center gap-8">
            <div className="flex space-x-8">
              <button
                onClick={() => changeTab('classes')}
                className={`font-semibold transition ${activeTab === 'classes' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-300 hover:text-white'}`}
              >
                수업
              </button>
              <button
                onClick={() => changeTab('classmates')}
                className={`font-semibold transition ${activeTab === 'classmates' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-300 hover:text-white'}`}
              >
                수강자들
              </button>
              <button
                onClick={() => changeTab('team')}
                className={`font-semibold transition ${activeTab === 'team' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-300 hover:text-white'}`}
              >
                팀
              </button>
              <button
                onClick={() => changeTab('myteam')}
                className={`font-semibold transition ${activeTab === 'myteam' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-300 hover:text-white'}`}
              >
                마이팀
              </button>
              <button
                onClick={() => changeTab('qna')}
                className={`font-semibold transition ${activeTab === 'qna' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-300 hover:text-white'}`}
              >
                Q&A
              </button>
            </div>
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => changeTab('mypage')}>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  류
                </div>
                <span className="text-white font-medium text-sm">류지원</span>
              </div>
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                <button onClick={() => changeTab('mypage')} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition text-gray-800 text-sm font-medium border-b border-gray-100">
                  👤 마이페이지
                </button>
                <button onClick={() => alert('결제이력 페이지는 준비중입니다.')} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition text-gray-800 text-sm font-medium border-b border-gray-100">
                  💳 결제이력
                </button>
                <button onClick={() => alert('설정 페이지는 준비중입니다.')} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition text-gray-800 text-sm font-medium">
                  ⚙️ 설정
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      //전체div감싸는div, 왜 있는지 사실 잘 모르겠다. 무슨 레이아웃 처리같은데
      <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1 w-full">
          //진짜 전체 div
          <div className="flex flex-row flex-1">
            // 사이드 네비게이션 바
            {activeTab === 'classes' && (
              <aside className="w-20 bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center py-6 gap-3 border-r border-amber-200 overflow-y-auto h-full">
                <button
                  onClick={() => changeTab('team')}
                  className={`w-16 h-16 rounded-xl font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1 ${activeTab === 'team'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-br hover:from-blue-400 hover:to-blue-500 hover:text-white hover:shadow-md hover:scale-105'
                    }`}
                >
                  <span className="text-xl">👥</span>
                  <span className="text-[10px]">팀</span>
                </button>
                <button
                  onClick={() => changeTab('myteam')}
                  className={`w-16 h-16 rounded-xl font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1 ${activeTab === 'myteam'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-br hover:from-purple-400 hover:to-purple-500 hover:text-white hover:shadow-md hover:scale-105'
                    }`}
                >
                  <span className="text-xl">⭐</span>
                  <span className="text-[10px]">내 팀</span>
                </button>
                <button
                  onClick={() => changeTab('classmates')}
                  className={`w-16 h-16 rounded-xl font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1 ${activeTab === 'classmates'
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-br hover:from-green-400 hover:to-green-500 hover:text-white hover:shadow-md hover:scale-105'
                    }`}
                >
                  <span className="text-xl">🎓</span>
                  <span className="text-[10px]">수강자</span>
                </button>
              </aside>
            )}
            //메인 콘텐츠 영역
            <main className="w-full px-4 py-8 relative flex-1">
              //react문법 나중에 build된다
              {activeTab === 'classes' && !showClassDetail && (
                <section className="fade-in max-w-[70%]">
                  <h2 className="text-2xl font-bold text-[#0f172a] mb-6">수강 중인 과목</h2>

                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <div key={cls.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 hover:border-blue-400 transition">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="min-w-[140px]">
                              <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                              <p className="text-xs text-gray-600">{cls.semester}</p>
                            </div>

                            <div className="flex items-center gap-1 min-w-[100px]">
                              <span className="text-gray-500 text-sm">👨‍🏫</span>
                              <span className="text-xs text-gray-700">{cls.professor}</span>
                            </div>

                            <div className="flex items-center gap-1 min-w-[140px]">
                              <span className="text-gray-500 text-sm">🕒</span>
                              <span className="text-xs text-gray-700">{cls.schedule}</span>
                            </div>

                            <div className="flex items-center gap-1 min-w-[90px]">
                              <span className="text-gray-500 text-sm">📍</span>
                              <span className="text-xs text-gray-700">{cls.room}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{cls.credits}학점</span>
                            <button
                              onClick={() => { setSelectedClass(cls); setShowClassDetail(true); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition text-xs whitespace-nowrap"
                            >
                              강의실입장
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                      <span>📚</span> 수강 정보 요약
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-black text-blue-600 mb-1">{classes.length}</p>
                        <p className="text-xs text-gray-600">수강 과목</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-black text-green-600 mb-1">{classes.reduce((sum, cls) => sum + cls.credits, 0)}</p>
                        <p className="text-xs text-gray-600">총 학점</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-black text-purple-600 mb-1">A+</p>
                        <p className="text-xs text-gray-600">평균 학점</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'classes' && showClassDetail && selectedClass && (
                <section className="fade-in max-w-[70%]">
                  <button
                    onClick={() => setShowClassDetail(false)}
                    className="text-blue-600 font-medium mb-4 flex items-center hover:underline"
                  >
                    ← 수업 목록으로 돌아가기
                  </button>

                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 mb-6">
                    <div className="border-b pb-4 mb-4">
                      <h2 className="text-3xl font-bold text-[#0f172a] mb-2">{selectedClass.name}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>👨‍🏫 {selectedClass.professor} 교수님</span>
                        <span>🕒 {selectedClass.schedule}</span>
                        <span>📍 {selectedClass.room}</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{selectedClass.credits}학점</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition cursor-pointer">
                        <div className="text-2xl mb-2">📚</div>
                        <h3 className="font-bold text-blue-900 mb-1">강의자료</h3>
                        <p className="text-xs text-gray-600">총 12개의 자료</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition cursor-pointer">
                        <div className="text-2xl mb-2">📝</div>
                        <h3 className="font-bold text-green-900 mb-1">과제</h3>
                        <p className="text-xs text-gray-600">제출 2 / 대기 1</p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition cursor-pointer">
                        <div className="text-2xl mb-2">📢</div>
                        <h3 className="font-bold text-purple-900 mb-1">공지사항</h3>
                        <p className="text-xs text-gray-600">새 공지 3개</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📚</span> 최근 강의자료
                    </h3>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-900">12주차 - React Hooks 심화</h4>
                            <p className="text-xs text-gray-600 mt-1">2026.04.20 업로드</p>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                            다운로드
                          </button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-900">11주차 - 상태 관리 패턴</h4>
                            <p className="text-xs text-gray-600 mt-1">2026.04.13 업로드</p>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                            다운로드
                          </button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-900">10주차 - 컴포넌트 설계</h4>
                            <p className="text-xs text-gray-600 mt-1">2026.04.06 업로드</p>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                            다운로드
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📝</span> 과제 현황
                    </h3>
                    <div className="space-y-3">
                      <div className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-red-900">기말 프로젝트 제출</h4>
                            <p className="text-xs text-gray-600 mt-1">마감: 2026.04.30 23:59</p>
                            <span className="inline-block mt-2 bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-bold">D-6</span>
                          </div>
                          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                            제출하기
                          </button>
                        </div>
                      </div>

                      <div className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-green-900">중간 과제 - React 프로젝트</h4>
                            <p className="text-xs text-gray-600 mt-1">제출일: 2026.04.15</p>
                            <span className="inline-block mt-2 bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold">제출 완료</span>
                          </div>
                          <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed">
                            제출됨
                          </button>
                        </div>
                      </div>

                      <div className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-green-900">1차 과제 - JavaScript 기초</h4>
                            <p className="text-xs text-gray-600 mt-1">제출일: 2026.03.20</p>
                            <span className="inline-block mt-2 bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold">제출 완료</span>
                          </div>
                          <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed">
                            제출됨
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'classmates' && (
                <section className="fade-in">
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-[#0f172a]">수강자들 네트워크</h2>
                    <span className="text-sm text-gray-500">프로필을 클릭하여 자기소개와 포트폴리오를 확인하세요.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {classmates.map((c, index) => (
                      <div
                        key={c.id}
                        onClick={() => c.name === '류지원 (나)' ? setShowEditProfileModal(true) : openProfile(c.id)}
                        className={`bg-white border-2 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition min-h-[480px] ${c.name === '류지원 (나)' ? 'border-blue-500 hover:border-blue-600' : 'border-gray-200 hover:border-blue-300'
                          }`}
                      >
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center font-bold text-2xl mb-4 overflow-hidden">
                          {c.profileImage ? (
                            <img src={c.profileImage} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{c.initial}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{c.name}</h4>
                        <p className="text-xs text-gray-500 mt-2 mb-4">{c.major}</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 w-full">
                          <p className="text-xs text-blue-900 leading-relaxed font-medium">{c.aspiration}</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1.5 w-full px-2">
                          {c.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-[10px] px-2.5 py-1.5 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'team' && (
                <section className="fade-in block">
                  {!showTeamDetail ? (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">[2026-1] [웹프로그래밍] [다반]</h2>
                        <button onClick={() => setShowCreateTeamModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transition">+ 새 팀 만들기</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
                        {teams.map(t => {
                          let aggroUI;
                          if (t.aggroType === 'help') {
                            aggroUI = (
                              <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-[11px] px-2.5 py-2 rounded-lg font-bold flex items-center justify-between animate-pulse shadow-sm">
                                <span>🚨 {t.aggroMessage}</span>
                                <span>도와주기 ❯</span>
                              </div>
                            );
                          } else if (t.aggroType === 'flex') {
                            aggroUI = (
                              <div className="mt-3 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] px-2.5 py-2 rounded-lg font-bold flex items-center justify-between shadow-sm">
                                <span>🔥 {t.aggroMessage}</span>
                                <span>구경가기 ❯</span>
                              </div>
                            );
                          } else {
                            aggroUI = <div className="mt-3 h-[34px]"></div>;
                          }

                          return (
                            <div key={t.id} onClick={() => openTeamDetail(t.name)} className="bg-white border rounded-xl flex flex-col min-h-[380px] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition duration-200 overflow-hidden">
                              <div className={`${t.bg} h-24 flex items-center justify-center border-b relative`}>
                                <h3 className="text-3xl font-black text-gray-800 opacity-50">{t.name}</h3>
                              </div>
                              <div className="p-5 flex flex-col flex-grow">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-xs font-bold text-blue-600">{t.status}</span>
                                  <span className="text-xs font-bold text-gray-500">{t.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                                  <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${t.progress}%` }}></div>
                                </div>
                                <h4 className="font-bold text-gray-900 leading-tight mb-1">{t.topic}</h4>
                                {aggroUI}
                                <div className="mt-auto flex -space-x-2 pt-5">
                                  {(t.members && t.members.length > 0 ? t.members : ['나']).map((m, i) => (
                                    <div key={i} className={`w-8 h-8 rounded-full ${circleColors[i % circleColors.length]} border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-700 shadow-sm`}>{m}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="fade-in">
                      <button onClick={() => setShowTeamDetail(false)} className="text-blue-600 font-medium mb-4 flex items-center hover:underline">
                        ← 뒤로가기
                      </button>
                      <h2 className="text-3xl font-bold mb-6 text-[#0f172a]">{selectedTeamName}</h2>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6 shadow-sm">
                        <h3 className="font-bold text-indigo-900 mb-2">✨ AI 통합 진행상황 요약</h3>
                        <p className="text-indigo-800 text-sm leading-relaxed">
                          현재 배포된 <strong>[웹페이지 v1.0]</strong>과 교수님께 전달한 <strong>[구현 애로사항]</strong>을 종합한 결과:<br />
                          팀은 프론트엔드 UI 퍼블리싱은 90% 이상 완료했으나, 백엔드 DB와의 연결에서 CORS 에러 문제를 겪고 있습니다. ~~한 방법으로 문제를 해결해볼 계획이며, 전체 프로젝트 진행률은 약 70%로 추정됩니다.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow border p-5">
                          <h3 className="font-bold mb-4 text-lg">📁 프로젝트 산출물 & 공유 자료</h3>
                          <ul className="space-y-3">
                            <li className="flex justify-between items-center bg-blue-50 border border-blue-200 p-3 rounded-lg hover:shadow-md transition">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🌐</span>
                                <div>
                                  <p className="font-bold text-blue-900 text-sm">실제 배포된 서비스 (v1.0)</p>
                                  <p className="text-xs text-blue-600">https://campus-connect.vercel.app</p>
                                </div>
                              </div>
                              <button onClick={() => window.open('https://example.com', '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition shadow-sm">
                                바로가기 ↗
                              </button>
                            </li>
                            <li className="flex justify-between items-center bg-gray-50 border p-3 rounded-lg hover:bg-gray-100 transition">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">💻</span>
                                <span className="font-medium text-gray-800 text-sm">source_code_final.zip</span>
                              </div>
                              <button onClick={() => alert('source_code_final.zip 파일 다운로드가 시작됩니다.')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-3 py-2 rounded font-medium flex items-center gap-1 transition">
                                <span>⬇️</span> 다운로드
                              </button>
                            </li>
                            <li className="flex justify-between items-center bg-gray-50 border p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-sm">
                                <span>📄</span> <span>기획안_초안.pdf</span>
                              </div>
                            </li>
                          </ul>
                          <button className="w-full mt-4 bg-gray-50 text-gray-600 py-2 rounded border border-dashed hover:bg-gray-100 transition">+ 링크 / 파일 업로드</button>
                        </div>

                        <div className="bg-white rounded-xl shadow border p-5 flex flex-col h-full">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg text-blue-900">🛠️ 트러블슈팅 로그</h3>
                            <span className="text-xs text-gray-500">문제 해결 과정 및 피드백</span>
                          </div>
                          <div className="flex-grow bg-blue-50/30 rounded-lg border border-blue-100 p-3 mb-4 overflow-y-auto text-sm space-y-4 h-[320px] custom-scrollbar">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">🟢 해결 완료</span>
                                  <span className="font-bold text-gray-800 text-xs">김규민</span>
                                </div>
                                <span className="text-gray-400 text-[10px]">어제 14:30</span>
                              </div>
                              <div className="space-y-2 text-gray-700 text-xs">
                                <p><span className="font-bold text-red-500">🚨 문제:</span> 메인 페이지 레이아웃이 모바일 환경에서 깨짐 현상 발생.</p>
                                <p><span className="font-bold text-blue-500">🏃 계획:</span> 개발자 도구(F12)로 HTML 구조 확인 후 CSS 클래스 충돌 여부 점검 예정.</p>
                                <div className="bg-green-50 border border-green-100 p-2.5 rounded mt-2 text-green-800">
                                  <span className="font-bold block mb-1">✅ 해결 방법:</span>
                                  .login-container와 .wrapper 클래스 이름이 다른 컴포넌트와 겹쳐서 발생한 문제였음. 클래스명을 명확히 분리하여 레이아웃 복구 완료!
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200 relative">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">🟡 해결 중</span>
                                  <span className="font-bold text-gray-800 text-xs">류지원</span>
                                  <span className="text-gray-400 text-xs flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded" title="다른 팀에게는 보이지 않습니다">🔒 비공개</span>
                                </div>
                                <span className="text-gray-400 text-[10px]">방금 전</span>
                              </div>
                              <div className="space-y-2 text-gray-700 text-xs">
                                <p><span className="font-bold text-red-500">🚨 문제:</span> 프론트(로컬)에서 백엔드 서버로 로그인 요청 시 계속 CORS 에러 발생 중.</p>
                                <p><span className="font-bold text-blue-500">🏃 계획:</span> 프론트엔드 프록시(Proxy) 설정을 추가하거나, 백엔드 담당자에게 헤더 설정 변경을 요청하여 테스트할 예정.</p>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                                <button className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium transition">💬 대댓글 달기</button>
                                <button className="text-[11px] bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded font-medium transition">✅ 해결 완료 처리</button>
                              </div>
                            </div>
                          </div>

                          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30 flex flex-col gap-2.5 shadow-sm">
                            <input type="text" placeholder="🚨 어떤 문제(에러)를 겪고 있나요?" className="w-full text-xs outline-none border border-gray-200 p-2 rounded focus:border-blue-500 bg-white" />
                            <input type="text" placeholder="🏃 원인을 어떻게 파악하고, 어떻게 해결할 계획인가요?" className="w-full text-xs outline-none border border-gray-200 p-2 rounded focus:border-blue-500 bg-white" />
                            <div className="flex justify-between items-center mt-1">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 hover:text-gray-800 font-medium">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#0f172a] cursor-pointer" />
                                🔒 교수님 & 팀원에게만 비공개
                              </label>
                              <button className="bg-[#0f172a] text-white px-4 py-2 rounded text-xs font-bold hover:bg-[#1e293b] transition shadow-sm">기록 남기기</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 bg-white border rounded-xl shadow-sm p-6 text-center">
                        <h3 className="font-bold text-lg mb-2">이 팀의 웹 서비스, 어떻게 생각하시나요?</h3>
                        <p className="text-gray-500 text-sm mb-6">배포된 링크를 확인해 보고, 피드백을 남겨주세요.</p>
                        <div className="flex justify-center space-x-4">
                          <button onClick={() => alert('평가 감사합니다!')} className="flex flex-col items-center p-4 w-32 border rounded-xl hover:bg-green-50 hover:border-green-400 transition cursor-pointer">
                            <span className="text-3xl mb-2">👍</span>
                            <span className="font-medium text-gray-700">좋아요</span>
                          </button>
                          <button onClick={() => alert('평가 감사합니다!')} className="flex flex-col items-center p-4 w-32 border rounded-xl hover:bg-gray-100 transition cursor-pointer">
                            <span className="text-3xl mb-2">🤔</span>
                            <span className="font-medium text-gray-700">보통이에요</span>
                          </button>
                          <button onClick={() => alert('평가 감사합니다!')} className="flex flex-col items-center p-4 w-32 border rounded-xl hover:bg-red-50 hover:border-red-400 transition cursor-pointer">
                            <span className="text-3xl mb-2">😥</span>
                            <span className="font-medium text-gray-700">아쉬워요</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'qna' && (
                <section className="fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0f172a]">Q&A 게시판</h2>
                      <p className="text-sm text-gray-500 mt-1">조회수와 좋아요 기반 TOP 3 질문은 상단에 하이라이트 됩니다.</p>
                    </div>
                    <button onClick={() => setShowWriteQnaModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium shadow">질문 작성</button>
                  </div>
                  <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <table className="min-w-full text-left">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-6 py-3 text-sm font-semibold text-gray-600">순위</th>
                          <th className="px-6 py-3 text-sm font-semibold text-gray-600">제목</th>
                          <th className="px-6 py-3 text-sm font-semibold text-gray-600 text-center">조회</th>
                          <th className="px-6 py-3 text-sm font-semibold text-gray-600 text-center">좋아요</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedQna.map((q, index) => {
                          const isTop3 = index < 3;
                          const rowClass = isTop3 ? 'bg-blue-50/60 border-l-4 border-blue-500 font-medium' : 'bg-white';
                          return (
                            <tr key={q.id} onClick={() => openQnaDetail(q.id)} className={`${rowClass} hover:bg-gray-100 transition cursor-pointer`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {isTop3 ? <span className="text-blue-600 font-bold">TOP {index + 1}</span> : <span className="text-gray-400">{index + 1}</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-900">{q.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{q.views}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">❤️ {q.likes}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'myteam' && (
                <section className="fade-in">
                  <h2 className="text-2xl font-bold text-[#0f172a] mb-6">마이팀</h2>

                  <div className="space-y-6">
                    {teams.filter(t => t.members.includes('나') || t.members.includes('류')).map(team => (
                      <div key={team.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h3>
                            <p className="text-lg text-gray-700">{team.topic}</p>
                            <div className="flex gap-3 mt-3">
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{team.status}</span>
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">진행률 {team.progress}%</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { changeTab('team'); openTeamDetail(team.name); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition"
                          >
                            팀 상세보기
                          </button>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
                          <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${team.progress}%` }}></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                              <span>👥</span> 팀원 정보
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {team.members.map((member, idx) => (
                                <div key={idx} className="bg-white rounded-lg px-4 py-2 border border-blue-200 flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full ${circleColors[idx % circleColors.length]} flex items-center justify-center text-sm font-bold text-gray-700`}>
                                    {member}
                                  </div>
                                  <span className="text-sm font-medium text-gray-800">
                                    {member === '나' || member === '류' ? '류지원 (나)' : `팀원 ${member}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                            <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                              <span>📊</span> 나의 역할
                            </h4>
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-3 border border-purple-200">
                                <p className="text-sm font-bold text-purple-900">담당 역할</p>
                                <p className="text-xs text-gray-700 mt-1">프론트엔드 개발 / UI 디자인</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-purple-200">
                                <p className="text-sm font-bold text-purple-900">기여도</p>
                                <p className="text-xs text-gray-700 mt-1">35% (팀 내 최고)</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-300">
                          <h4 className="font-bold text-yellow-900 mb-4 flex items-center gap-2">
                            <span>📝</span> 최근 활동
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-gray-900">메인 페이지 UI 구현 완료</p>
                                <span className="text-xs text-gray-500">2일 전</span>
                              </div>
                              <p className="text-sm text-gray-600">React 컴포넌트 구조 설계 및 Tailwind CSS 적용</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-gray-900">트러블슈팅 로그 작성</p>
                                <span className="text-xs text-gray-500">3일 전</span>
                              </div>
                              <p className="text-sm text-gray-600">CORS 에러 해결 과정 문서화</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {teams.filter(t => t.members.includes('나') || t.members.includes('류')).length === 0 && (
                      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">아직 소속된 팀이 없습니다</h3>
                        <p className="text-gray-600 mb-6">팀 프로젝트 페이지에서 새로운 팀을 만들거나 기존 팀에 참여하세요.</p>
                        <button
                          onClick={() => changeTab('team')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition"
                        >
                          팀 프로젝트 페이지로 이동
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'mypage' && (
                <section className="fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold text-[#0f172a]">마이페이지</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMypageView('report')}
                          className={`px-4 py-2 rounded-lg font-bold transition ${mypageView === 'report'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          리포트
                        </button>
                        <button
                          onClick={() => setMypageView('info')}
                          className={`px-4 py-2 rounded-lg font-bold transition ${mypageView === 'info'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          개인정보
                        </button>
                      </div>
                    </div>
                    <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition flex items-center gap-2">
                      상세 리포트 보기
                    </button>
                  </div>

                  {mypageView === 'report' && (
                    <div className="grid grid-cols-4 gap-6 mb-8">
                      <div className="col-span-3 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-8">
                        <div className="border-b-4 border-blue-600 pb-4 mb-6">
                          <h3 className="text-3xl font-black text-gray-900 mb-2">📊 팀 프로젝트 경력 요약 리포트</h3>
                          <p className="text-sm text-gray-600">학교 팀 프로젝트 경험을 체계적으로 정리한 취업 포트폴리오 자료</p>
                          <p className="text-xs text-gray-400 mt-1">생성일: 2026년 4월 23일</p>
                        </div>

                        <div className="space-y-8">
                          {/* 프로젝트 경력 요약 */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-l-4 border-blue-600">
                            <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                              <span>🎯</span> 프로젝트 참여 현황
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <p className="text-3xl font-black text-blue-600 mb-1">999</p>
                                <p className="text-xs text-gray-600 font-medium">참여 프로젝트</p>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <p className="text-3xl font-black text-green-600 mb-1">999</p>
                                <p className="text-xs text-gray-600 font-medium">해결한 문제</p>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <p className="text-3xl font-black text-purple-600 mb-1">999</p>
                                <p className="text-xs text-gray-600 font-medium">맡은 직책</p>
                              </div>
                            </div>
                          </div>

                          {/* 프로젝트별 상세 경력 */}
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <span>📁</span> 프로젝트별 상세 경력
                            </h4>
                            <div className="space-y-6">
                              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition bg-white">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h5 className="text-lg font-black text-gray-900">캠퍼스 카풀 웹서비스</h5>
                                    <p className="text-sm text-gray-600 mt-1">2026.03 - 2026.06 | 1조 | <span className="text-blue-600 font-bold">프론트엔드 개발</span></p>
                                  </div>
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">완료 95%</span>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-bold text-gray-500 mb-1">주요 역할 및 기여</p>
                                    <ul className="text-sm text-gray-700 space-y-1 ml-4">
                                      <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>React + TypeScript 기반 프론트엔드 아키텍처 설계 및 구현</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>실시간 카풀 매칭 UI/UX 구현 (사용자 만족도 4.5/5.0)</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>Vercel 배포 및 성능 최적화 (Lighthouse 점수 92점)</span>
                                      </li>
                                    </ul>
                                  </div>

                                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <p className="text-xs font-bold text-yellow-800 mb-2 flex items-center gap-1">
                                      <span>🔧</span> 핵심 문제해결 사례
                                    </p>
                                    <p className="text-xs text-yellow-900 mb-2"><strong>문제:</strong> 모바일 환경에서 레이아웃 깨짐 현상 발생</p>
                                    <p className="text-xs text-yellow-900 mb-2"><strong>해결:</strong> CSS 클래스명 충돌 발견 → 명확한 네이밍 컨벤션 적용으로 해결</p>
                                    <p className="text-xs text-yellow-900"><strong>성과:</strong> 반응형 레이아웃 완성, 모든 디바이스에서 정상 작동</p>
                                  </div>

                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-bold text-gray-700 mb-2">사용 기술 스택</p>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">React</span>
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">TypeScript</span>
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Tailwind CSS</span>
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">REST API</span>
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Vercel</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition bg-white">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h5 className="text-lg font-black text-gray-900">AI 학식 메뉴 추천 시스템</h5>
                                    <p className="text-sm text-gray-600 mt-1">2026.02 - 2026.04 | 2조 | <span className="text-blue-600 font-bold">백엔드 개발 / DB 설계</span></p>
                                  </div>
                                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">진행중 40%</span>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-bold text-gray-500 mb-1">주요 역할 및 기여</p>
                                    <ul className="text-sm text-gray-700 space-y-1 ml-4">
                                      <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>PostgreSQL 데이터베이스 스키마 설계 및 ERD 작성</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>Node.js + Express 기반 RESTful API 서버 구축</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>쿼리 최적화로 응답속도 70% 개선 (평균 150ms → 45ms)</span>
                                      </li>
                                    </ul>
                                  </div>

                                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1">
                                      <span>🚨</span> 현재 진행중인 문제해결
                                    </p>
                                    <p className="text-xs text-red-900 mb-2"><strong>문제:</strong> 프론트엔드-백엔드 간 CORS 에러 지속 발생</p>
                                    <p className="text-xs text-red-900 mb-2"><strong>시도한 방법:</strong> 백엔드 헤더 설정, Proxy 설정 등</p>
                                    <p className="text-xs text-red-900"><strong>계획:</strong> 미들웨어 검증 로직 재점검 및 도메인 화이트리스트 확인 예정</p>
                                  </div>

                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-bold text-gray-700 mb-2">사용 기술 스택</p>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Node.js</span>
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Express</span>
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">PostgreSQL</span>
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">JWT</span>
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">AWS EC2</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 핵심 역량 및 성과 */}
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <span>💪</span> 핵심 역량 및 성과
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                                <h5 className="font-bold text-purple-900 mb-3">기술 역량</h5>
                                <ul className="space-y-2 text-sm text-gray-700">
                                  <li className="flex items-center gap-2">
                                    <span className="text-purple-500">✓</span>
                                    <span>프론트엔드: React, TypeScript, Tailwind</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <span className="text-purple-500">✓</span>
                                    <span>백엔드: Node.js, Express, REST API</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <span className="text-purple-500">✓</span>
                                    <span>데이터베이스: PostgreSQL, MongoDB</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <span className="text-purple-500">✓</span>
                                    <span>배포/인프라: Vercel, AWS EC2, Git</span>
                                  </li>
                                </ul>
                              </div>

                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-200">
                                <h5 className="font-bold text-blue-900 mb-3">협업 및 리더십</h5>
                                <ul className="space-y-2 text-sm text-gray-700">
                                  <li className="flex items-center gap-2">
                                    <span className="text-blue-500">✓</span>
                                    <span>3개 프로젝트 팀 리드 경험</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <span className="text-blue-500">✓</span>
                                    <span>Git/GitHub 협업 워크플로우 구축</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <span className="text-blue-500">✓</span>
                                    <span>코드 리뷰 및 품질 관리 담당</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <span className="text-blue-500">✓</span>
                                    <span>트러블슈팅 문서화 및 지식 공유</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* 주요 소스코드 샘플 */}
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <span>💻</span> 주요 소스코드 샘플
                            </h4>
                            <div className="bg-gray-900 rounded-lg p-5 overflow-x-auto">
                              <p className="text-xs text-gray-400 mb-3">// React 컴포넌트 최적화 예시 (메모이제이션 활용)</p>
                              <pre className="text-sm text-green-400 font-mono">
                                {`const CarPoolCard = React.memo(({ pool }) => {
  const handleJoin = useCallback(() => {
    joinCarPool(pool.id);
  }, [pool.id]);

  return (
    <div className="card">
      <h3>{pool.destination}</h3>
      <button onClick={handleJoin}>참여하기</button>
    </div>
  );
});`}
                              </pre>
                            </div>

                            <div className="bg-gray-900 rounded-lg p-5 overflow-x-auto mt-3">
                              <p className="text-xs text-gray-400 mb-3">// API 서버 최적화 예시 (쿼리 성능 개선)</p>
                              <pre className="text-sm text-blue-400 font-mono">
                                {`app.get('/api/menus', async (req, res) => {
  const menus = await db.query(\`
    SELECT m.*, AVG(r.rating) as avg_rating
    FROM menus m
    LEFT JOIN reviews r ON m.id = r.menu_id
    WHERE m.available = true
    GROUP BY m.id
    ORDER BY avg_rating DESC
    LIMIT 20
  \`);
  res.json(menus);
});`}
                              </pre>
                            </div>
                          </div>

                          {/* 향후 목표 */}
                          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border-2 border-orange-300">
                            <h4 className="text-xl font-bold text-orange-900 mb-3 flex items-center gap-2">
                              <span>🎯</span> 향후 학습 및 성장 목표
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">→</span>
                                <span>풀스택 개발자로서 프론트엔드-백엔드 통합 역량 강화</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">→</span>
                                <span>클라우드 인프라 (AWS, Docker, Kubernetes) 실무 경험 확보</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">→</span>
                                <span>오픈소스 프로젝트 기여 및 개발자 커뮤니티 활동</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
                          <p className="text-xs text-gray-400">본 리포트는 CampusConnect 시스템에서 자동으로 생성되었습니다.</p>
                          <p className="text-xs text-gray-400 mt-1">팀 프로젝트 경험을 체계적으로 정리하여 취업 포트폴리오로 활용하세요.</p>
                        </div>
                      </div>

                      <div className="col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg sticky top-20">
                          <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                            <span>✨</span> 리포트 활용 팁
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-bold text-green-800 mb-1">📝 이력서 작성</p>
                              <p className="text-xs text-gray-700">프로젝트별 경험을 복사하여 이력서에 활용하세요</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-bold text-green-800 mb-1">💼 면접 준비</p>
                              <p className="text-xs text-gray-700">문제해결 사례를 STAR 기법으로 정리</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-bold text-green-800 mb-1">📊 포트폴리오</p>
                              <p className="text-xs text-gray-700">기술 스택과 성과를 시각화하여 활용</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span>📈</span> 성장 그래프
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-700">기술 역량</span>
                                <span className="text-xs font-bold text-blue-600">85%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-700">협업 능력</span>
                                <span className="text-xs font-bold text-green-600">92%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-700">문제 해결</span>
                                <span className="text-xs font-bold text-purple-600">78%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-700">리더십</span>
                                <span className="text-xs font-bold text-orange-600">99%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
                          <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                            <span>🏆</span> 획득 배지
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                              <span className="text-2xl mb-1 block">🚀</span>
                              <p className="text-xs font-bold text-gray-800">팀 리더</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                              <span className="text-2xl mb-1 block">💡</span>
                              <p className="text-xs font-bold text-gray-800">문제해결사</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                              <span className="text-2xl mb-1 block">⚡</span>
                              <p className="text-xs font-bold text-gray-800">빠른 개발</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                              <span className="text-2xl mb-1 block">🎯</span>
                              <p className="text-xs font-bold text-gray-800">목표 달성</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span>📚</span> 추천 학습
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <p className="text-xs font-bold text-blue-900 mb-1">Docker & Kubernetes</p>
                              <p className="text-xs text-gray-600">컨테이너 기술 학습 추천</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-bold text-green-900 mb-1">GraphQL</p>
                              <p className="text-xs text-gray-600">REST API 대안 기술</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <p className="text-xs font-bold text-purple-900 mb-1">CI/CD</p>
                              <p className="text-xs text-gray-600">자동화 배포 파이프라인</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {mypageView === 'info' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-lg border p-8">
                          <div className="flex items-center gap-6 mb-8 pb-6 border-b">
                            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                              류
                            </div>
                            <div>
                              <h3 className="text-3xl font-bold text-gray-900 mb-2">류지원</h3>
                              <p className="text-gray-600">{myProfileMajor}</p>
                              <div className="flex gap-2 mt-3">
                                {myProfileTags.map(tag => (
                                  <span key={tag} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">#{tag}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span>📧</span> 이메일
                              </h4>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">jiwon.ryu@sejong.ac.kr</p>
                            </div>

                            <div>
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span>🎓</span> 학번
                              </h4>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">20241234</p>
                            </div>

                            <div>
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span>📱</span> 연락처
                              </h4>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">010-1234-5678</p>
                            </div>

                            <div>
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span>💡</span> 자기소개
                              </h4>
                              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                                웹개발 수업을 통해 실무 경험을 쌓고 싶습니다. 팀 프로젝트에서 적극적으로 협업하며 성장하겠습니다.
                              </p>
                            </div>

                            <div>
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span>🎯</span> 진로 목표
                              </h4>
                              <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 leading-relaxed">
                                이번 프로젝트에서 개발 역할을 하고 싶습니다!
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setShowEditProfileModal(true)}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition shadow-md"
                          >
                            ✏️ 프로필 수정
                          </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border p-6">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>👥</span> 소속 팀
                          </h4>
                          <div className="space-y-3">
                            {teams.filter(t => t.members.includes('나') || t.members.includes('류')).map(team => (
                              <div key={team.id} className="bg-gray-50 border rounded-lg p-4 hover:bg-gray-100 transition cursor-pointer" onClick={() => { changeTab('team'); openTeamDetail(team.name); }}>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h5 className="font-bold text-gray-900">{team.name}</h5>
                                    <p className="text-sm text-gray-600 mt-1">{team.topic}</p>
                                  </div>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{team.progress}%</span>
                                </div>
                              </div>
                            ))}
                            {teams.filter(t => t.members.includes('나') || t.members.includes('류')).length === 0 && (
                              <p className="text-gray-500 text-sm text-center py-4">아직 소속된 팀이 없습니다.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                          <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <span>📊</span> 활동 통계
                          </h4>
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4">
                              <p className="text-xs text-gray-500 mb-1">작성한 Q&A</p>
                              <p className="text-2xl font-bold text-gray-900">{qnaData.filter(q => q.author === '류지원 (나)').length}개</p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                              <p className="text-xs text-gray-500 mb-1">참여중인 팀</p>
                              <p className="text-2xl font-bold text-gray-900">{teams.filter(t => t.members.includes('나') || t.members.includes('류')).length}개</p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                              <p className="text-xs text-gray-500 mb-1">프로필 조회수</p>
                              <p className="text-2xl font-bold text-gray-900">47회</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border p-6">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📁</span> 포트폴리오
                          </h4>
                          <div className="space-y-2">
                            <div className="border rounded-lg p-3 hover:bg-gray-50 transition cursor-pointer flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>📄</span>
                                <span className="text-sm font-medium text-gray-800">류지원_포트폴리오.pdf</span>
                              </div>
                              <button className="text-xs text-blue-600 hover:text-blue-800">다운로드</button>
                            </div>
                          </div>
                          <button className="w-full mt-3 border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:bg-gray-50 transition text-sm font-medium">
                            + 파일 추가
                          </button>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
                          <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                            <span>🔔</span> 알림 설정
                          </h4>
                          <div className="space-y-3">
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="text-sm text-gray-700">팀 업데이트 알림</span>
                              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="text-sm text-gray-700">Q&A 답변 알림</span>
                              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="text-sm text-gray-700">마감일 알림</span>
                              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'team' && !showTeamDetail && (
                <div className="mt-16 mb-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-[#0f172a] mb-2">📢 최근 업데이트 & 활동</h2>
                    <p className="text-gray-600">실시간으로 확인하는 팀별 진행상황과 새로운 소식</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                      <div className="bg-white rounded-xl p-5 shadow border hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">🎉 신규업데이트</span>
                          <span className="text-xs text-gray-400">방금 전</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">트러블슈팅 로그 기능 추가!</h3>
                        <p className="text-sm text-gray-600">팀 프로젝트 페이지에서 문제 해결 과정을 기록하고 공유할 수 있는 트러블슈팅 로그 기능이 추가되었습니다.</p>
                      </div>

                      <div className="bg-white rounded-xl p-5 shadow border hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">✅ 1조</span>
                          <span className="text-xs text-gray-400">10분 전</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">print.py 제출 완료!</h3>
                        <p className="text-sm text-gray-600">1조 팀이 핵심 파이썬 스크립트를 성공적으로 제출했습니다. 데이터 처리 로직이 모두 구현되었다고 합니다.</p>
                      </div>

                      <div className="bg-white rounded-xl p-5 shadow border hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">🔧 3조</span>
                          <span className="text-xs text-gray-400">30분 전</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">API 오류 해결됨!</h3>
                        <p className="text-sm text-gray-600">3조가 겪던 REST API 연동 문제를 드디어 해결했습니다. CORS 설정 수정으로 정상 작동 중입니다.</p>
                      </div>

                      <div className="bg-white rounded-xl p-5 shadow border hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">🎨 4조</span>
                          <span className="text-xs text-gray-400">1시간 전</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">기가막힌 웹 레이아웃 제출함!</h3>
                        <p className="text-sm text-gray-600">4조의 새로운 UI 디자인이 제출되었습니다. 반응형 레이아웃과 애니메이션 효과가 인상적입니다.</p>
                      </div>

                      <div className="bg-white rounded-xl p-5 shadow border hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">📢 공지</span>
                          <span className="text-xs text-gray-400">2시간 전</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">최종 발표 일정 안내</h3>
                        <p className="text-sm text-gray-600">최종 프로젝트 발표는 다음주 금요일 오후 2시에 진행됩니다. 모든 팀은 15분 발표 + 5분 질의응답 형식입니다.</p>
                      </div>

                      <div className="bg-white rounded-xl p-5 shadow border hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-bold">💡 2조</span>
                          <span className="text-xs text-gray-400">3시간 전</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">데이터베이스 최적화 성공!</h3>
                        <p className="text-sm text-gray-600">2조가 쿼리 실행 속도를 70% 개선했습니다. 인덱싱과 쿼리 최적화를 통해 성능이 대폭 향상되었습니다.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5 shadow-lg sticky top-20">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">📌</span>
                          <h3 className="font-black text-orange-900">중요 공지 & 마감일</h3>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-red-600 font-bold text-sm">🔴 긴급</span>
                              <span className="text-xs text-gray-500">오늘</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">DB 연결 마감</p>
                            <p className="text-xs text-gray-600">D-3 (12월 27일까지)</p>
                          </div>

                          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-blue-600 font-bold text-sm">👨‍🏫 교수님</span>
                              <span className="text-xs text-gray-500">1시간 전</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">세종대왕 교수님</p>
                            <p className="text-xs text-gray-600">조만간 시험일정을 공개하겠습니다.</p>
                          </div>

                          <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-yellow-600 font-bold text-sm">⚠️ 주의</span>
                              <span className="text-xs text-gray-500">어제</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">중간 점검 발표</p>
                            <p className="text-xs text-gray-600">D-7 (1월 3일 오후 2시)</p>
                          </div>

                          <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-purple-600 font-bold text-sm">📝 과제</span>
                              <span className="text-xs text-gray-500">2일 전</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">API 명세서 제출</p>
                            <p className="text-xs text-gray-600">D-10 (1월 6일 23:59까지)</p>
                          </div>

                          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-green-600 font-bold text-sm">✅ 완료</span>
                              <span className="text-xs text-gray-500">3일 전</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">기획안 제출</p>
                            <p className="text-xs text-gray-600">모든 팀 제출 완료</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
          {/* 진짜 그냥 푸터 */}
          <footer className="bg-[#0f172a] text-gray-300 w-full">
            <div className="w-full px-4 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="text-white font-bold text-xl mb-4">CampusConnect</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    학생들의 팀 프로젝트 협업을 위한<br />
                    올인원 플랫폼
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">연락처</h4>
                  <ul className="space-y-2 text-sm">
                    <li>📧 support@campusconnect.com</li>
                    <li>📞 02-1234-5678</li>
                    <li>📍 서울특별시 광진구 능동로 209</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">바로가기</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white transition">이용약관</a></li>
                    <li><a href="#" className="hover:text-white transition">개인정보처리방침</a></li>
                    <li><a href="#" className="hover:text-white transition">공지사항</a></li>
                    <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
                <p>© 2026 CampusConnect. All rights reserved.</p>
                <p className="mt-2">본 서비스는 교육 목적으로 제작된 프로젝트입니다.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {showPopularModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl relative fade-in">
            <button onClick={() => setShowPopularModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl">&times;</button>
            <div className="text-center mb-6">
              <span className="text-4xl">🔥</span>
              <h2 className="text-2xl font-bold mt-2 text-[#0f172a]">가장 주목받는 프로젝트</h2>
              <p className="text-gray-500 text-sm mt-1">현재 학우들의 관심(조회수)이 가장 높은 팀입니다.</p>
            </div>
            <div className="space-y-4">
              <div className="border p-4 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition" onClick={() => openTeamDetail('1조')}>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-blue-900">🥇 1조 (캠퍼스 카풀 웹서비스)</h4>
                  <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border shadow-sm">조회수 1,240</span>
                </div>
                <p className="text-sm mt-2 text-gray-700">"프론트엔드 배포 완료 및 테스트 진행 중"</p>
              </div>
              <div className="border p-4 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition" onClick={() => openTeamDetail('4조')}>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-800">🥈 4조 (스터디 매칭 시스템)</h4>
                  <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border shadow-sm">조회수 985</span>
                </div>
                <p className="text-sm mt-2 text-gray-700">"API 연동 및 동료 테스트 요청"</p>
              </div>
            </div>
            <button onClick={() => setShowPopularModal(false)} className="mt-6 w-full bg-[#0f172a] text-white py-3 rounded-lg font-bold hover:bg-[#1e293b] transition">확인</button>
          </div>
        </div>
      )}

      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl">&times;</button>
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-bold text-xl">{selectedProfile.initial}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedProfile.name}</h2>
                <p className="text-gray-500">{selectedProfile.major}</p>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-2">자기소개</h3>
              <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded border">{selectedProfile.intro}</p>
            </div>
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-2">포트폴리오 & 첨부파일</h3>
              <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer text-blue-600 text-sm transition">
                📄 <span className="ml-2 font-medium">{selectedProfile.portfolio}</span>
              </div>
            </div>
            <button className="w-full bg-[#0f172a] text-white py-3 rounded-lg font-bold hover:bg-[#1e293b] transition">1:1 채팅하기</button>
          </div>
        </div>
      )}

      {showQnaModal && selectedQna && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl relative">
            <button onClick={() => setShowQnaModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl">&times;</button>
            <div className="mb-4">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">작성자: {selectedQna.author}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedQna.title}</h2>
            </div>
            <hr className="my-4" />
            <p className="text-gray-700 min-h-[100px]">{selectedQna.content}</p>
            <div className="mt-8 flex justify-center">
              <button onClick={likeCurrentQna} className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-500 px-6 py-2 rounded-full hover:bg-red-100 transition shadow-sm">
                ❤️ 좋아요 <span className="font-bold">{selectedQna.likes}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProfileModal && (
        <EditProfileModal
          onClose={() => setShowEditProfileModal(false)}
          onSave={saveProfile}
          initialMajor={myProfileMajor}
          initialTags={myProfileTags}
        />
      )}

      {showWriteQnaModal && (
        <WriteQnaModal
          onClose={() => setShowWriteQnaModal(false)}
          onSubmit={submitQna}
        />
      )}

      {showCreateTeamModal && (
        <CreateTeamModal
          onClose={() => setShowCreateTeamModal(false)}
          onSubmit={submitCreateTeam}
          classmates={classmates}
        />
      )}
    </div>
  );
}

function EditProfileModal({ onClose, onSave, initialMajor, initialTags }: { onClose: () => void; onSave: (major: string, career: string, hobbies: string) => void; initialMajor: string; initialTags: string[] }) {
  const [major, setMajor] = useState(initialMajor);
  const [career, setCareer] = useState(initialTags.slice(0, 1).join(', '));
  const [hobbies, setHobbies] = useState(initialTags.slice(1).join(', '));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl relative fade-in">
        <h2 className="text-2xl font-bold text-[#0f172a] mb-6">내 정보 수정</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">전공</label>
            <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">진로 관심분야 <span className="text-xs font-normal text-gray-400 ml-1">(쉼표로 구분)</span></label>
            <input type="text" value={career} onChange={(e) => setCareer(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">취미 및 관심사 <span className="text-xs font-normal text-gray-400 ml-1">(쉼표로 구분)</span></label>
            <input type="text" value={hobbies} onChange={(e) => setHobbies(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">포트폴리오 파일 업로드</label>
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition">
              <span className="text-2xl mb-1">📂</span>
              <span className="text-sm font-medium text-gray-600">클릭하여 파일 선택</span>
              <span className="text-xs text-gray-400 mt-1">PDF, ZIP, PPT (최대 50MB)</span>
            </label>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">취소</button>
          <button onClick={() => onSave(major, career, hobbies)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">저장하기</button>
        </div>
      </div>
    </div>
  );
}

function WriteQnaModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (title: string, content: string) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl relative fade-in">
        <h2 className="text-2xl font-bold text-[#0f172a] mb-6">✍️ 새 질문 작성</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="질문 제목을 입력하세요" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-1 focus:ring-blue-500 outline-none resize-none" rows={5} placeholder="구체적인 내용을 입력하세요"></textarea>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">취소</button>
          <button onClick={() => onSubmit(title, content)} className="px-5 py-2.5 bg-[#0f172a] text-white rounded-lg font-bold hover:bg-[#1e293b] transition shadow-sm">등록하기</button>
        </div>
      </div>
    </div>
  );
}

function CreateTeamModal({ onClose, onSubmit, classmates }: { onClose: () => void; onSubmit: (name: string, topic: string, members: string[]) => void; classmates: Classmate[] }) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (initial: string) => {
    if (selectedMembers.includes(initial)) {
      setSelectedMembers(selectedMembers.filter(m => m !== initial));
    } else {
      setSelectedMembers([...selectedMembers, initial]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl relative fade-in">
        <h2 className="text-2xl font-bold text-[#0f172a] mb-6">✨ 새 팀 만들기</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">팀명 (조 이름)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="예: 6조" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">프로젝트 주제</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="예: AI 기반 자동화 솔루션" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">팀원 추가 <span className="text-xs font-normal text-gray-400 ml-1">(선택)</span></label>
            <div className="w-full border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
              {classmates.map(c => (
                <label key={c.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(c.initial)}
                    onChange={() => toggleMember(c.initial)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-800">{c.name} <span className="text-xs text-gray-400 font-normal ml-1">({c.major})</span></span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">취소</button>
          <button onClick={() => onSubmit(name, topic, selectedMembers)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">만들기</button>
        </div>
      </div>
    </div>
  );
}
