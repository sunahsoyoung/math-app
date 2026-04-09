# ✨ 반짝반짝 연산수다방

1학년 수학 연산 앱입니다.

---

## 🚀 배포 방법 (Vercel — 가장 쉬움)

### 1단계: GitHub에 올리기

1. [github.com](https://github.com) 에서 계정 만들기 (이미 있으면 생략)
2. 오른쪽 위 **+** 버튼 → **New repository** 클릭
3. Repository name: `math-app` 입력 후 **Create repository**
4. 페이지에 나오는 안내에 따라 이 폴더를 업로드

   **Git이 설치된 경우** (터미널에서):
   ```bash
   cd math-app
   git init
   git add .
   git commit -m "첫 배포"
   git remote add origin https://github.com/내아이디/math-app.git
   git push -u origin main
   ```

   **Git이 없는 경우**:
   GitHub 페이지에서 **uploading an existing file** 클릭 → 이 폴더 안의 파일들을 드래그앤드롭

### 2단계: Vercel에서 배포

1. [vercel.com](https://vercel.com) 접속 → **Sign up** (GitHub 계정으로 로그인)
2. **Add New Project** 클릭
3. GitHub에서 `math-app` 저장소 선택 → **Import**
4. 설정은 기본값 그대로 → **Deploy** 클릭
5. 1~2분 후 `https://math-app-xxx.vercel.app` 링크 생성! 🎉

---

## 💻 로컬에서 실행하기

Node.js가 설치되어 있어야 합니다. ([nodejs.org](https://nodejs.org) 에서 LTS 버전 설치)

```bash
cd math-app
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 열기

---

## 📦 빌드하기

```bash
npm run build
```

`dist/` 폴더가 생성됩니다. 이 폴더를 서버에 올리면 됩니다.
