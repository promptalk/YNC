# 참고


---

## Google Dirve Search file 용 정규식

```
{{last(split(2.`5`; "/"))}}
```

---
## HTTP노드의 Body content 내용

```
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "이 명함 이미지에서 다음 정보를 추출해서 JSON 형식으로 정리해줘: 이름(name), 회사(company), 직급(position), 전화번호(phone), 이메일(email)."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,{{base64(18.data)}}"
          }
        }
      ]
    }
  ]
}
```

---
## JSON노드의 JSON String 내용

```
{{replace(19.data.choices[].message.content; "/```json|```/g"; "")}}
```

---