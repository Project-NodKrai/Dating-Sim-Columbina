# Task 03: 전체 프로젝트 디버깅 및 코드 품질 개선 계획서

## 목표 (Objective)
프로젝트 전반의 숨은 버그(메모리 누수, Stale Closure 등)를 찾아내고, React Best Practice 및 3D 성능/아키텍처 관점에서 코드를 최적화합니다.

## 디버깅 및 구현 단계 (Implementation Steps)

### Step 1: React `useEffect` 의존성 및 Stale Closure 해결
- **이슈:** `App.tsx`의 타이머 관련 `useEffect`(방치 감지, 랜덤 이벤트 등) 내에서 최신 상태(`state`)나 함수(`updateStats`, `setDialogue`)가 누락되어 동작이 꼬이거나 타이머가 불필요하게 잦은 재등록을 반복하는 문제가 예상됩니다.
- **조치 방안:** 상태 변수들을 `useRef`로 동기화하거나 State Updater Callback 패턴을 활용하여 의존성 배열에 의한 타이머/루프 재생성을 최소화하고 닫힘(Closure) 버그를 예방합니다.

### Step 2: 3D 렌더링 성능 최적화 및 메모리 관리 (`VRMViewer.tsx`)
- **이슈:** React 생명주기(마운트/언마운트)에 따른 불필요한 Canvas/Scene 렌더링 부하나 이벤트 리스너 누수 위험이 있습니다.
- **조치 방안:** 
  - `dispose` 처리가 완벽히 되고 있는지 점검 (Three.js Object3D/Material).
  - 브라우저 이탈 시 빈 프레임 낭비를 줄이는 안전장치 로직 도입 검토 (또는 Clock 최적화).

### Step 3: UI 및 구조(Architecture/Tailwind) 개선
- **이슈:** 다수의 버튼 및 요소가 모듈화되어있지 않아 `App.tsx`가 거대해지는 경향이 있습니다. Tailwind CSS의 안티패턴(과도한 inline styling) 여부 점검.
- **조치 방안:** UI의 반복되는 렌더링 요소를 최적화하고, 불필요한 리렌더링 차단을 위해 `memo` 사용을 검토합니다.

### Step 4: Virtual Clippy & 783 Test Simulation (자가검증)
- 모든 수정이 완료된 후 구동 테스트 및 품질 게이트 자가 진단을 수행하여 보고서를 작성합니다.

---
**작업지시자님, 이 계획대로 진행할까요?**
