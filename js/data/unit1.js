// 第2关 Unit 1 Family 家庭（16 单句 | 10 长对话 | 4 独白；20 事实 | 10 高阶）
export const unit1 = {
  "id": "unit1",
  "title": "Unit 1 Family 家庭",
  "questions": [
    {
      "no": 1,
      "type": "choose",
      "audio": "That old man is my grandfather.",
      "options": [
        {
          "t": "祖母",
          "img": "grandmother"
        },
        {
          "t": "祖父",
          "img": "grandfather"
        },
        {
          "t": "表弟",
          "img": "cousin"
        }
      ],
      "answer": 1,
      "point": "grandfather",
      "limit": 20
    },
    {
      "no": 2,
      "type": "choose",
      "audio": "My grandmother is very kind.",
      "options": [
        {
          "t": "祖父",
          "img": "grandfather"
        },
        {
          "t": "爸爸",
          "img": "father"
        },
        {
          "t": "祖母",
          "img": "grandmother"
        }
      ],
      "answer": 2,
      "point": "grandmother / kind",
      "limit": 20
    },
    {
      "no": 3,
      "type": "choose",
      "audio": "This little boy is my cousin.",
      "options": [
        {
          "t": "亲哥哥",
          "img": "brother"
        },
        {
          "t": "表兄弟",
          "img": "cousin"
        },
        {
          "t": "亲叔叔",
          "img": "uncle"
        }
      ],
      "answer": 1,
      "point": "cousin",
      "limit": 20
    },
    {
      "no": 4,
      "type": "choose",
      "audio": "My parents love me very much.",
      "options": [
        {
          "t": "父母",
          "img": "parents"
        },
        {
          "t": "祖父母",
          "img": "grandparents"
        },
        {
          "t": "姐妹",
          "img": "sister"
        }
      ],
      "answer": 0,
      "point": "parent 复数",
      "limit": 20
    },
    {
      "no": 5,
      "type": "choose",
      "audio": "We love each other in our family.",
      "options": [
        {
          "t": "相亲相爱",
          "img": "love"
        },
        {
          "t": "一起吃饭",
          "img": "dinner"
        },
        {
          "t": "分开住",
          "img": "apart"
        }
      ],
      "answer": 0,
      "point": "love each other",
      "limit": 20
    },
    {
      "no": 6,
      "type": "choose",
      "audio": "We live together in Beijing.",
      "options": [
        {
          "t": "一起玩耍",
          "img": "play"
        },
        {
          "t": "住在一起",
          "img": "home"
        },
        {
          "t": "分开居住",
          "img": "apart"
        }
      ],
      "answer": 1,
      "point": "live together",
      "limit": 20
    },
    {
      "no": 7,
      "type": "response",
      "audio": "Who is he?",
      "options": [
        {
          "t": "He is my brother."
        },
        {
          "t": "He is my cousin."
        },
        {
          "t": "He is my grandfather."
        }
      ],
      "answer": 2,
      "point": "who 问人 + 代词",
      "limit": 20
    },
    {
      "no": 8,
      "type": "response",
      "audio": "How many people are there in your family?",
      "options": [
        {
          "t": "There are five."
        },
        {
          "t": "There are six."
        },
        {
          "t": "There are four."
        }
      ],
      "answer": 0,
      "point": "how many / there are",
      "limit": 20
    },
    {
      "no": 9,
      "type": "response",
      "audio": "Who is that woman?",
      "options": [
        {
          "t": "She is my grandmother."
        },
        {
          "t": "She is my aunt."
        },
        {
          "t": "She is my mother."
        }
      ],
      "answer": 0,
      "point": "who + 代词 she",
      "limit": 20
    },
    {
      "no": 10,
      "type": "response",
      "audio": "Is this your cousin?",
      "options": [
        {
          "t": "Yes, he does."
        },
        {
          "t": "Yes, it is."
        },
        {
          "t": "Yes, I can."
        }
      ],
      "answer": 1,
      "point": "指示代词用 it 回答",
      "limit": 20
    },
    {
      "no": 11,
      "type": "judge",
      "screen": {
        "img": "grandfather",
        "t": "一位老爷爷"
      },
      "audio": "He is my grandfather.",
      "options": [
        {
          "t": "错"
        },
        {
          "t": "对"
        }
      ],
      "answer": 1,
      "point": "grandfather",
      "limit": 20
    },
    {
      "no": 12,
      "type": "judge",
      "screen": {
        "img": "family-five",
        "t": "五口之家"
      },
      "audio": "There are three people in my family.",
      "options": [
        {
          "t": "错"
        },
        {
          "t": "对"
        }
      ],
      "answer": 0,
      "point": "there be 数量",
      "limit": 20
    },
    {
      "no": 13,
      "type": "judge",
      "screen": {
        "img": "family-photo",
        "t": "全家福照片"
      },
      "audio": "This is our family photo.",
      "options": [
        {
          "t": "对"
        },
        {
          "t": "错"
        }
      ],
      "answer": 0,
      "point": "family photo",
      "limit": 20
    },
    {
      "no": 14,
      "type": "info",
      "audio": "There are five people in my family.",
      "options": [
        {
          "t": "5"
        },
        {
          "t": "4"
        },
        {
          "t": "6"
        }
      ],
      "answer": 0,
      "point": "数字 five",
      "limit": 20
    },
    {
      "no": 15,
      "type": "info",
      "audio": "My grandfather is seventy years old.",
      "options": [
        {
          "t": "17"
        },
        {
          "t": "7"
        },
        {
          "t": "70"
        }
      ],
      "answer": 2,
      "point": "seventy",
      "limit": 20
    },
    {
      "no": 16,
      "type": "info",
      "audio": "My father's brother is my uncle.",
      "options": [
        {
          "t": "表哥或表弟",
          "img": "cousin"
        },
        {
          "t": "爷爷或外公",
          "img": "grandfather"
        },
        {
          "t": "叔叔或伯伯",
          "img": "uncle"
        }
      ],
      "answer": 2,
      "point": "father's brother 统称 uncle（中文分叔叔、伯伯）",
      "limit": 20
    },
    {
      "no": 17,
      "type": "dialog",
      "audio": [
        "Look at this photo, Sam. Who is the old man?",
        "He is my grandfather.",
        "And who is the woman next to him?",
        "That is my grandmother. They are very kind.",
        "What a happy family!"
      ],
      "ask": "Who is the old man in the photo?",
      "options": [
        {
          "t": "Sam's grandfather."
        },
        {
          "t": "Sam's stepfather."
        },
        {
          "t": "Sam's grandson."
        }
      ],
      "answer": 0,
      "point": "事实细节 识别人物",
      "limit": 30
    },
    {
      "no": 18,
      "type": "dialog",
      "audio": [
        "Look at this photo, Sam. Who is the old man?",
        "He is my grandfather.",
        "And who is the woman next to him?",
        "That is my grandmother. They are very kind.",
        "What a happy family!"
      ],
      "ask": "What does Sam think of his grandparents?",
      "options": [
        {
          "t": "They are late."
        },
        {
          "t": "They are tall."
        },
        {
          "t": "They are kind."
        }
      ],
      "answer": 2,
      "point": "attitude 观点态度",
      "limit": 30
    },
    {
      "no": 19,
      "type": "dialog",
      "audio": [
        "How many people are there in your family, Amy?",
        "There are five.",
        "Five? Who are they?",
        "My parents, my grandfather, my little brother and me.",
        "You have a big family!"
      ],
      "ask": "How many people are there in Amy's family?",
      "options": [
        {
          "t": "4."
        },
        {
          "t": "6."
        },
        {
          "t": "5."
        }
      ],
      "answer": 2,
      "point": "事实细节 how many",
      "limit": 30
    },
    {
      "no": 20,
      "type": "dialog",
      "audio": [
        "How many people are there in your family, Amy?",
        "There are five.",
        "Five? Who are they?",
        "My parents, my grandfather, my little brother and me.",
        "You have a big family!"
      ],
      "ask": "How many brothers does Amy have?",
      "options": [
        {
          "t": "Two."
        },
        {
          "t": "One."
        },
        {
          "t": "Three."
        }
      ],
      "answer": 1,
      "point": "infer 推断（a little brother）",
      "limit": 30
    },
    {
      "no": 21,
      "type": "dialog",
      "audio": [
        "Where do you live now, Jack?",
        "I live in a flat in Beijing with my family.",
        "Do you live with your grandparents?",
        "Yes. We all live together."
      ],
      "ask": "Who live with Jack?",
      "options": [
        {
          "t": "His friends and classmates."
        },
        {
          "t": "His family and grandparents."
        },
        {
          "t": "His teachers and neighbours."
        }
      ],
      "answer": 1,
      "point": "infer 推断同住的人",
      "limit": 30
    },
    {
      "no": 22,
      "type": "dialog",
      "audio": [
        "Where do you live now, Jack?",
        "I live in a flat in Beijing with my family.",
        "Do you live with your grandparents?",
        "Yes. We all live together."
      ],
      "ask": "Which is true about Jack?",
      "options": [
        {
          "t": "He lives with his family in a flat."
        },
        {
          "t": "He lives alone in a big house."
        },
        {
          "t": "He lives far from his family."
        }
      ],
      "answer": 0,
      "point": "infer 综合判断",
      "limit": 30
    },
    {
      "no": 23,
      "type": "dialog",
      "audio": [
        "Who is that boy on the bike, Lily?",
        "He is my cousin, Mike.",
        "Is he your brother?",
        "No. He is my aunt's son. He is twelve, the same age as me."
      ],
      "ask": "Who is the boy on the bike?",
      "options": [
        {
          "t": "Lily's brother."
        },
        {
          "t": "Lily's cousin."
        },
        {
          "t": "Lily's uncle."
        }
      ],
      "answer": 1,
      "point": "事实细节 识别人物",
      "limit": 30
    },
    {
      "no": 24,
      "type": "dialog",
      "audio": [
        "Who is that boy on the bike, Lily?",
        "He is my cousin, Mike.",
        "Is he your brother?",
        "No. He is my aunt's son. He is twelve, the same age as me."
      ],
      "ask": "Mike is the son of Lily's ...",
      "options": [
        {
          "t": "sister."
        },
        {
          "t": "aunt."
        },
        {
          "t": "grandmother."
        }
      ],
      "answer": 1,
      "point": "infer 所有格 aunt's",
      "limit": 30
    },
    {
      "no": 25,
      "type": "dialog",
      "audio": [
        "What do you often do with your family, Tom?",
        "We have dinner together every evening.",
        "That is nice. Do you love your family?",
        "Yes. We love each other very much."
      ],
      "ask": "What are they mainly talking about?",
      "options": [
        {
          "t": "School life together."
        },
        {
          "t": "A family dinner party."
        },
        {
          "t": "Family time together."
        }
      ],
      "answer": 2,
      "point": "main 主旨要义",
      "limit": 30
    },
    {
      "no": 26,
      "type": "dialog",
      "audio": [
        "What do you often do with your family, Tom?",
        "We have dinner together every evening.",
        "That is nice. Do you love your family?",
        "Yes. We love each other very much."
      ],
      "ask": "How does Tom feel about his family?",
      "options": [
        {
          "t": "They love each other."
        },
        {
          "t": "They are often late."
        },
        {
          "t": "They live far away."
        }
      ],
      "answer": 0,
      "point": "attitude 观点态度",
      "limit": 30
    },
    {
      "no": 27,
      "type": "mono",
      "audio": "Hello, everyone. My name is Anna. I have a happy family. There are four people in my family: my father, my mother, my little sister and me. We love each other, and we live in Shanghai.",
      "ask": "How many people are there in Anna's family?",
      "options": [
        {
          "t": "5."
        },
        {
          "t": "3."
        },
        {
          "t": "4."
        }
      ],
      "answer": 2,
      "point": "事实细节 抓数量",
      "limit": 30
    },
    {
      "no": 28,
      "type": "mono",
      "audio": "Hello, everyone. My name is Anna. I have a happy family. There are four people in my family: my father, my mother, my little sister and me. We love each other, and we live in Shanghai.",
      "ask": "What is Anna mainly talking about?",
      "options": [
        {
          "t": "Her happy family."
        },
        {
          "t": "Her school."
        },
        {
          "t": "Her favourite subject."
        }
      ],
      "answer": 0,
      "point": "main 主旨要义",
      "limit": 30
    },
    {
      "no": 29,
      "type": "mono",
      "audio": "Look at my family photo. These are my grandfather and grandmother. My grandfather is seventy, and he likes reading. My grandmother is a doctor. She is very kind. I love them very much.",
      "ask": "What does the grandfather like doing?",
      "options": [
        {
          "t": "Cooking."
        },
        {
          "t": "Running."
        },
        {
          "t": "Reading."
        }
      ],
      "answer": 2,
      "point": "infer 抓细节推断喜好",
      "limit": 30
    },
    {
      "no": 30,
      "type": "mono",
      "audio": "Look at my family photo. These are my grandfather and grandmother. My grandfather is seventy, and he likes reading. My grandmother is a doctor. She is very kind. I love them very much.",
      "ask": "How does the speaker feel about her grandparents?",
      "options": [
        {
          "t": "She fears them."
        },
        {
          "t": "She loves them."
        },
        {
          "t": "She misses them."
        }
      ],
      "answer": 1,
      "point": "attitude 观点态度",
      "limit": 30
    }
  ]
};
