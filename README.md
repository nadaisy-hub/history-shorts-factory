# 역사 쇼츠 팩토리

AI 기반 역사 유튜브 쇼츠 자동 제작 대시보드

## 기능

- **AI 대본 생성**: Claude API로 주제 기반 쇼츠 대본 자동 생성
- **이미지 생성**: fal.ai (Flux 2 Pro)로 장면별 이미지 생성
- **영상 변환**: ModelsLab (Kling)으로 이미지→영상 변환
- **음성 생성**: ElevenLabs TTS로 나레이션 생성
- **영상 조립**: Shotstack으로 최종 영상 렌더링
- **YouTube 업로드**: Google OAuth 연동 게시

## 파이프라인 (Human-in-the-Loop)

각 단계 사이에 검수 게이트가 있어 사용자가 확인 후 승인해야 다음 단계로 진행됩니다.

```
대본 생성 → [검수] → 이미지 생성 → [검수] → 영상 변환 → [검수] → 음성 생성 → [검수] → 영상 조립 → [최종 검수] → 게시
```

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- 로컬 JSON 파일 스토리지 (DB 불필요)

## 시작하기

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local에 API 키 입력

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 접속

## 필요한 API 키

| API | 용도 | 편당 비용 |
|-----|------|----------|
| Claude API | 대본 생성 | ~$0.02 |
| fal.ai | 이미지 생성 | ~$0.21 |
| ModelsLab | 영상 변환 | ~$0.70 |
| ElevenLabs | 음성 생성 | ~$0.15 |
| Shotstack | 영상 조립 | ~$0.05 |

**편당 총 비용: ~$1.13**
