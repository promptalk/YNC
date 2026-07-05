# YNC 프로젝트 폴더 구조

이 저장소는 AI 도구 활용 실습 자료 및 관련 에셋을 포함하고 있습니다.

---

## 폴더 구조

```
YNC/
├── assets/                          # 실습에 사용되는 자료 파일
│   ├── 내_제품_든_가상_인플루언서_광고_만들기.m4a   # 가상 인플루언서 광고 관련 오디오
│   ├── 취업규칙.pdf                   # 취업규칙 문서
│   └── 노트북LM활용/                  # NotebookLM 활용 실습 자료
│       ├── [Promptalk.ai] 노트북LM 스타일 프롬프트 모음.pdf  # 프롬프트 모음집
│       ├── DiL500 user manual_EN_.pdf             # 기기 사용 설명서 (영문)
│       ├── 기업분석/                  # 기업 분석 실습용 문서
│       │   ├── [트레이드 브리프] (15) 반도체 전방산업 업황 진단_최종.pdf
│       │   ├── SK하이닉스.pdf
│       │   └── 분기연결재무제표.pdf
│       └── 모의고사/                  # 고1 전국연합학력평가 기출문제 (2022~2025)
│           ├── 2022학년도 3월 ~ 11월 문제지 & 정답
│           ├── 2023학년도 3월 ~ 11월 문제지 & 정답
│           ├── 2024학년도 3월 ~ 10월 문제지 & 정답
│           └── 2025학년도 3월 ~ 9월 문제지 & 정답
│
└── imgs/                            # 이미지 파일
    ├── format=auto,w=5504.png
    ├── format=auto,w=5504 (1).png
    ├── format=auto,w=5504 (2).png
    └── format=auto,w=5504 (3).png
```

---

## 폴더별 설명

### `assets/`
실습에 활용되는 다양한 형식의 파일이 담긴 폴더입니다.

- **내_제품_든_가상_인플루언서_광고_만들기.m4a** — 가상 인플루언서 광고 제작 관련 오디오 파일
- **취업규칙.pdf** — 취업규칙 관련 PDF 문서

#### `assets/노트북LM활용/`
Google NotebookLM을 활용한 실습을 위한 자료 모음입니다.

- **프롬프트 모음.pdf** — NotebookLM 스타일 프롬프트 예시 모음 (Promptalk.ai 제공)
- **DiL500 user manual** — 영문 기기 사용 설명서 (NotebookLM 문서 요약 실습용)

#### `assets/노트북LM활용/기업분석/`
기업 분석 실습을 위한 리포트 및 재무제표 PDF 파일들입니다.

- 반도체 전방산업 업황 분석 리포트
- SK하이닉스 기업 분석 자료
- 분기 연결 재무제표

#### `assets/노트북LM활용/모의고사/`
고1 전국연합학력평가 기출 문제지와 정답지입니다. (2022~2025학년도)
NotebookLM을 활용한 학습 자료 분석 실습에 사용됩니다.

### `imgs/`
NotebookLM으로 생성한 인포그래픽 예제 이미지 파일들입니다. 각 이미지는 [Promptalk.ai] 노트북LM 스타일 프롬프트 모음에서 제안하는 스타일별 프롬프트를 적용한 결과물입니다.

---


---

## LLM 기초 — 이미지 생성 / 편집 프롬프트 예제

> 출처: `LLM 기초_1_0604.pdf` · 이미지: [`assets/llm-basic-0604/`](assets/llm-basic-0604/)
> 각 예제의 프롬프트는 아래 `프롬프트 복사` 블록을 펼쳐 그대로 복사해 사용하세요.

---

### 1. 제품 사진 (텍스트 → 이미지)

스튜디오 조명으로 촬영한 듯한 고해상도 제품 사진을 생성합니다. 대괄호 `[ ]` 부분만 원하는 값으로 바꿔 사용하세요.

<img src="assets/llm-basic-0604/page-03-image-02.png" width="360" alt="스튜디오 조명 제품 사진 결과">

<details>
<summary>프롬프트 복사</summary>

```
A high-resolution, studio-lit product photograph of a [product description]
on a [background surface/description].
The lighting is a [lighting setup, e.g., three-point softbox setup] to [lighting purpose].
The camera angle is a [angle type] to showcase [specific feature].
Ultra-realistic, with sharp focus on [key detail].
[Aspect ratio].
```

</details>

---

### 2. 고양이에 마법사 모자 씌우기 (이미지 편집)

<table>
<tr><th>원본</th><th>결과</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-04-image-02.png" width="320" alt="원본 고양이"></td>
<td><img src="assets/llm-basic-0604/page-04-image-03.png" width="320" alt="마법사 모자를 쓴 고양이"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
Using the provided image of my cat, please add a small, knitted wizard hat
on its head.
Make it look like it's sitting comfortably and matches the soft lighting
of the photo.
```

</details>

---

### 3. 소파만 골라 교체하기 (부분 편집)

파란 소파만 빈티지 브라운 가죽 체스터필드 소파로 교체하고, 나머지 요소는 그대로 유지합니다.

<table>
<tr><th>원본</th><th>결과</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-05-image-03.png" width="320" alt="파란 소파 거실"></td>
<td><img src="assets/llm-basic-0604/page-05-image-02.png" width="320" alt="브라운 가죽 소파로 교체된 거실"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
Using the provided image of a living room, change only the blue sofa to be
a vintage, brown leather chesterfield sofa.
Keep the rest of the room, including the pillows on the sofa and the lighting,
unchanged.
```

</details>

---

### 4. 반 고흐 '별이 빛나는 밤' 스타일 변환 (스타일 트랜스퍼)

<table>
<tr><th>원본</th><th>결과</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-06-image-02.png" width="320" alt="밤의 도시 거리 사진"></td>
<td><img src="assets/llm-basic-0604/page-06-image-03.png" width="320" alt="반 고흐 스타일로 변환된 도시"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
Transform the provided photograph of a modern city street at night
into the artistic style of Vincent van Gogh's 'Starry Night'.
Preserve the original composition of buildings and cars,
but render all elements with swirling, impasto brushstrokes
and a dramatic palette of deep blues and bright yellows.
```

</details>

---

### 5. 스케치를 실물 콘셉트카로 (스케치 → 실사)

<table>
<tr><th>원본 (스케치)</th><th>결과</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-07-image-02.png" width="320" alt="자동차 연필 스케치"></td>
<td><img src="assets/llm-basic-0604/page-07-image-03.png" width="320" alt="완성된 콘셉트카"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
Turn this rough pencil sketch of a futuristic car into a polished photo
of the finished concept car in a showroom.
Keep the sleek lines and low profile from the sketch
but add metallic blue paint and neon rim lighting.
```

</details>

---

### 6. 기계식 키보드 키캡 3D 렌더 (텍스트 → 이미지)

`{ }` 안의 텍스트·색상·로고만 바꾸면 원하는 문구의 키캡을 만들 수 있습니다.

<table>
<tr><th>예시 A</th><th>예시 B</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-08-image-02.png" width="320" alt="키캡 렌더 A"></td>
<td><img src="assets/llm-basic-0604/page-08-image-03.png" width="320" alt="키캡 렌더 B"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
ultra-realistic 3D render of four mechanical keyboard keycaps in a tight 2x2 grid,
all keys touching.
View from an isometric angle.
One key is transparent with the word "{just}" printed in {white}.
The other three colors are: {black, purple, and white}.
One key features the {Github} logo. The other two say "{fork}" and "{it}".
Realistic plastic texture, rounded sculpted keycaps, soft shadows,
clean light-gray background.
```

</details>

---

### 7. 화면 밖으로 튀어나오는 3D 인물 (강제 원근)

<table>
<tr><th>예시 A</th><th>예시 B</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-09-image-02.png" width="300" alt="폰 밖으로 나오는 인물 A"></td>
<td><img src="assets/llm-basic-0604/page-09-image-03.png" width="300" alt="폰 밖으로 나오는 인물 B"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
Hyperrealistic, top-down bird's-eye view shot, a beautiful Instagram model
[Anne Hathaway / see reference image], with exquisite and beautiful makeup
and fashionable styling, standing on the screen of a smartphone held up by someone.
The image creates a strong perspective illusion.
Emphasize the 3D effect of the girl standing out from the phone.
She wears black-rimmed glasses, high-street fashion, and strikes a cute, playful pose.
The phone screen is treated as a dark floor, like a small stage.
The scene uses strong forced perspective to show the proportional difference
between the hand, the phone, and the girl.
The background is clean gray, using soft indoor light, shallow depth of field,
and the overall style is surrealistic photorealistic compositing.
Very strong perspective.
```

</details>

---

### 8. 사진을 바블헤드로 (캐리커처화)

머리는 살짝 키우고 얼굴은 정확하게, 몸은 카툰화합니다. `[ ]` 안에 배치 장소를 지정하세요.

<table>
<tr><th>예시 A</th><th>예시 B</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-10-image-02.png" width="320" alt="바블헤드 예시 A"></td>
<td><img src="assets/llm-basic-0604/page-10-image-03.png" width="320" alt="바블헤드 예시 B"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
Turn this photo into a bobblehead: enlarge the head slightly,
keep the face accurate and cartoonify the body.
[Place it on a bookshelf].
```

</details>

---

### 9. 미니멀 크리에이티브 광고 (오브제 + 손그림 두들)

실제 사물을 손으로 그린 검정 잉크 두들과 결합한 광고 이미지를 만듭니다. `[ ]` 부분만 브랜드/카피에 맞게 교체하세요.

<table>
<tr><th>예시 A</th><th>예시 B</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-11-image-02.png" width="300" alt="미니멀 광고 예시 A"></td>
<td><img src="assets/llm-basic-0604/page-11-image-03.png" width="300" alt="미니멀 광고 예시 B"></td>
</tr>
</table>

<details>
<summary>프롬프트 복사</summary>

```
A minimalist and creative advertisement set on a clean white background.
A real [Real Object] is integrated into a hand-drawn black ink doodle,
using loose, playful lines.
The [Doodle Concept] interacts with the object in a clever, imaginative way.
Include bold black [Ad Copy] text at the top or center.
Place the [Brand Logo] clearly at the bottom.
The visual should be clean, fun, high-contrast, and conceptually smart.
```

</details>

---

### 10. 1/7 스케일 상품화 피규어 (사진 → 피규어)

인물 사진을 실제 데스크 위에 놓인 1/7 스케일 수집용 피규어로 변환합니다. 화면 속 3D 모델링 과정과 패키지 박스까지 함께 연출됩니다.

<table>
<tr><th>원본</th><th>결과</th></tr>
<tr>
<td><img src="assets/llm-basic-0604/page-13-image-03.png" width="300" alt="원본 인물 사진"></td>
<td><img src="assets/llm-basic-0604/page-13-image-02.png" width="300" alt="1/7 스케일 피규어 결과"></td>
</tr>
</table>

추가 예시 (손흥민 선수 사진 → 피규어):

<img src="assets/llm-basic-0604/page-12-image-02.png" width="320" alt="손흥민 피규어 예시">

<details>
<summary>프롬프트 복사</summary>

```
Create a 1/7 scale commercialized figurine of the characters in the picture,
in a realistic style, in a real environment.
The figurine is placed on a computer desk.
The figurine has a round transparent acrylic base, with no text on the base.
The content on the computer screen is a 3D modeling process of this figurine.
Next to the computer screen is a toy packaging box,
designed in a style reminiscent of high-quality collectible figures,
printed with original artwork.
The packaging features two-dimensional flat illustrations.
```

</details>

---

## 참고

- 이 저장소의 PDF 및 오디오 파일은 AI 도구 활용 교육 실습 목적으로 수집된 자료입니다.
- 모의고사 문제지는 한국교육과정평가원 및 각 시·도 교육청에서 제공한 공개 자료입니다.
- 이미지 생성 프롬프트 예제 이미지는 `LLM 기초_1_0604.pdf`에서 추출하여 [`assets/llm-basic-0604/`](assets/llm-basic-0604/)에 저장했습니다.
