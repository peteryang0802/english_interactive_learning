// 第3关 Unit 2 School Life 学校生活（12 单句 | 12 长对话 | 6 独白；18 事实 | 12 高阶）
export const unit2 = {
  "id": "unit2",
  "title": "Unit 2 School Life 学校生活",
  "questions": [
    {
      "no": 1,
      "type": "choose",
      "audio": "My favourite subject is Science.",
      "options": [
        {
          "t": "数学",
          "img": "maths"
        },
        {
          "t": "科学",
          "img": "science"
        },
        {
          "t": "语文",
          "img": "chinese"
        }
      ],
      "answer": 1,
      "point": "subject / Science",
      "limit": 20
    },
    {
      "no": 2,
      "type": "choose",
      "audio": "We have a Maths lesson today.",
      "options": [
        {
          "t": "数学课",
          "img": "maths"
        },
        {
          "t": "体育课",
          "img": "pe"
        },
        {
          "t": "美术课",
          "img": "art"
        }
      ],
      "answer": 0,
      "point": "lesson / Maths",
      "limit": 20
    },
    {
      "no": 3,
      "type": "choose",
      "audio": "This girl is my new classmate.",
      "options": [
        {
          "t": "同班同学",
          "img": "classmate"
        },
        {
          "t": "任课老师",
          "img": "teacher"
        },
        {
          "t": "亲妹妹",
          "img": "sister"
        }
      ],
      "answer": 0,
      "point": "classmate",
      "limit": 20
    },
    {
      "no": 4,
      "type": "choose",
      "audio": "I do my homework after school.",
      "options": [
        {
          "t": "做作业",
          "img": "homework"
        },
        {
          "t": "吃晚饭",
          "img": "dinner"
        },
        {
          "t": "起床",
          "img": "getup"
        }
      ],
      "answer": 0,
      "point": "homework",
      "limit": 20
    },
    {
      "no": 5,
      "type": "response",
      "audio": "Which subject do you like best?",
      "options": [
        {
          "t": "My favourite subject is History."
        },
        {
          "t": "My favourite subject is English."
        },
        {
          "t": "My favourite subject is Chinese."
        }
      ],
      "answer": 2,
      "point": "what's favourite",
      "limit": 20
    },
    {
      "no": 6,
      "type": "response",
      "audio": "Have you got a new book?",
      "options": [
        {
          "t": "Yes, I have."
        },
        {
          "t": "Yes, I do."
        },
        {
          "t": "Yes, I can."
        }
      ],
      "answer": 0,
      "point": "have got 回答",
      "limit": 20
    },
    {
      "no": 7,
      "type": "response",
      "audio": "When do you start your first lesson?",
      "options": [
        {
          "t": "In the classroom."
        },
        {
          "t": "With my friend."
        },
        {
          "t": "At eight o'clock."
        }
      ],
      "answer": 2,
      "point": "start + 时间",
      "limit": 20
    },
    {
      "no": 8,
      "type": "response",
      "audio": "What time do you finish school?",
      "options": [
        {
          "t": "At four."
        },
        {
          "t": "On Monday."
        },
        {
          "t": "At school."
        }
      ],
      "answer": 0,
      "point": "finish + 时间",
      "limit": 20
    },
    {
      "no": 9,
      "type": "judge",
      "screen": {
        "img": "science-lesson",
        "t": "一节科学课"
      },
      "audio": "We are having a Science lesson.",
      "options": [
        {
          "t": "对"
        },
        {
          "t": "错"
        }
      ],
      "answer": 0,
      "point": "Science lesson",
      "limit": 20
    },
    {
      "no": 10,
      "type": "judge",
      "screen": {
        "img": "empty-bag",
        "t": "空书包"
      },
      "audio": "I have got many books in my bag.",
      "options": [
        {
          "t": "对"
        },
        {
          "t": "错"
        }
      ],
      "answer": 1,
      "point": "have got 理解",
      "limit": 20
    },
    {
      "no": 11,
      "type": "info",
      "audio": "We have six lessons today.",
      "options": [
        {
          "t": "5"
        },
        {
          "t": "6"
        },
        {
          "t": "7"
        }
      ],
      "answer": 1,
      "point": "复数 lessons / 数字",
      "limit": 20
    },
    {
      "no": 12,
      "type": "info",
      "audio": "I finish my homework at half past eight.",
      "options": [
        {
          "t": "8:00"
        },
        {
          "t": "8:30"
        },
        {
          "t": "9:30"
        }
      ],
      "answer": 1,
      "point": "half past eight",
      "limit": 20
    },
    {
      "no": 13,
      "type": "dialog",
      "audio": [
        "What is your favourite subject, Lucy?",
        "I like PE best. It is fun.",
        "Do you like Science?",
        "Science is a little difficult for me."
      ],
      "ask": "What is Lucy's favourite subject?",
      "options": [
        {
          "t": "Science."
        },
        {
          "t": "Maths."
        },
        {
          "t": "PE."
        }
      ],
      "answer": 2,
      "point": "事实细节 favourite",
      "limit": 30
    },
    {
      "no": 14,
      "type": "dialog",
      "audio": [
        "What is your favourite subject, Lucy?",
        "I like PE best. It is fun.",
        "Do you like Science?",
        "Science is a little difficult for me."
      ],
      "ask": "How does Lucy feel about Science?",
      "options": [
        {
          "t": "Very easy for me."
        },
        {
          "t": "A little difficult."
        },
        {
          "t": "Great fun for me."
        }
      ],
      "answer": 1,
      "point": "attitude 观点态度",
      "limit": 30
    },
    {
      "no": 15,
      "type": "dialog",
      "audio": [
        "Have you got a pen, Mike?",
        "No, I haven't. But I have got two pencils.",
        "Can I use one?",
        "Sure. Here you are."
      ],
      "ask": "What has Mike got?",
      "options": [
        {
          "t": "Just one pen."
        },
        {
          "t": "So many books."
        },
        {
          "t": "Two pencils."
        }
      ],
      "answer": 2,
      "point": "事实细节 have got",
      "limit": 30
    },
    {
      "no": 16,
      "type": "dialog",
      "audio": [
        "Have you got a pen, Mike?",
        "No, I haven't. But I have got two pencils.",
        "Can I use one?",
        "Sure. Here you are."
      ],
      "ask": "What does the boy want to do?",
      "options": [
        {
          "t": "Buy a new pen."
        },
        {
          "t": "Borrow a pencil."
        },
        {
          "t": "Read a new book."
        }
      ],
      "answer": 1,
      "point": "infer 推断意图",
      "limit": 30
    },
    {
      "no": 17,
      "type": "dialog",
      "audio": [
        "When do you start school in the morning?",
        "We start at eight.",
        "And when do you finish?",
        "We finish at half past three."
      ],
      "ask": "When does school start?",
      "options": [
        {
          "t": "At three."
        },
        {
          "t": "At eight."
        },
        {
          "t": "At four."
        }
      ],
      "answer": 1,
      "point": "事实细节 start",
      "limit": 30
    },
    {
      "no": 18,
      "type": "dialog",
      "audio": [
        "When do you start school in the morning?",
        "We start at eight.",
        "And when do you finish?",
        "We finish at half past three."
      ],
      "ask": "What time do they finish school?",
      "options": [
        {
          "t": "3:30."
        },
        {
          "t": "3:00."
        },
        {
          "t": "4:30."
        }
      ],
      "answer": 0,
      "point": "infer 抓 half past three",
      "limit": 30
    },
    {
      "no": 19,
      "type": "dialog",
      "audio": [
        "Who is that woman, Anna?",
        "She is Miss Wang, our English teacher.",
        "Is she nice?",
        "Yes. She is always kind and helpful. We all love her."
      ],
      "ask": "Who is Miss Wang?",
      "options": [
        {
          "t": "A new girl classmate."
        },
        {
          "t": "A young Science student."
        },
        {
          "t": "An English teacher."
        }
      ],
      "answer": 2,
      "point": "infer 推断身份",
      "limit": 30
    },
    {
      "no": 20,
      "type": "dialog",
      "audio": [
        "Who is that woman, Anna?",
        "She is Miss Wang, our English teacher.",
        "Is she nice?",
        "Yes. She is always kind and helpful. We all love her."
      ],
      "ask": "What do the students think of Miss Wang?",
      "options": [
        {
          "t": "Strict and cold."
        },
        {
          "t": "Rude and lazy."
        },
        {
          "t": "Kind and helpful."
        }
      ],
      "answer": 2,
      "point": "attitude 观点态度",
      "limit": 30
    },
    {
      "no": 21,
      "type": "dialog",
      "audio": [
        "Do you often do homework in the library?",
        "Sometimes. I usually do it at home.",
        "How long does it take?",
        "About an hour every day."
      ],
      "ask": "Where does the girl usually do her homework?",
      "options": [
        {
          "t": "In the library."
        },
        {
          "t": "At school."
        },
        {
          "t": "At home."
        }
      ],
      "answer": 2,
      "point": "infer 频度 usually",
      "limit": 30
    },
    {
      "no": 22,
      "type": "dialog",
      "audio": [
        "Do you often do homework in the library?",
        "Sometimes. I usually do it at home.",
        "How long does it take?",
        "About an hour every day."
      ],
      "ask": "How often does she do homework?",
      "options": [
        {
          "t": "Never."
        },
        {
          "t": "Every day."
        },
        {
          "t": "Only on Sunday."
        }
      ],
      "answer": 1,
      "point": "infer 频度 every day",
      "limit": 30
    },
    {
      "no": 23,
      "type": "dialog",
      "audio": [
        "How many lessons do you have on Monday?",
        "We have Chinese, Maths, English and PE.",
        "That is four lessons. Do you like Monday?",
        "Yes. It is a busy but happy day."
      ],
      "ask": "How many lessons do they have on Monday?",
      "options": [
        {
          "t": "4."
        },
        {
          "t": "3."
        },
        {
          "t": "5."
        }
      ],
      "answer": 0,
      "point": "事实细节 数量",
      "limit": 30
    },
    {
      "no": 24,
      "type": "dialog",
      "audio": [
        "How many lessons do you have on Monday?",
        "We have Chinese, Maths, English and PE.",
        "That is four lessons. Do you like Monday?",
        "Yes. It is a busy but happy day."
      ],
      "ask": "What are they talking about?",
      "options": [
        {
          "t": "The lessons on Monday."
        },
        {
          "t": "A school birthday party."
        },
        {
          "t": "A big family dinner."
        }
      ],
      "answer": 0,
      "point": "main 主旨要义",
      "limit": 30
    },
    {
      "no": 25,
      "type": "mono",
      "audio": "Hello. My name is David. I love my school. We start school at eight and finish at four. My favourite subject is Science. My classmates are very nice. We often play together after school.",
      "ask": "What is David's favourite subject?",
      "options": [
        {
          "t": "PE."
        },
        {
          "t": "Science."
        },
        {
          "t": "Chinese."
        }
      ],
      "answer": 1,
      "point": "事实细节 favourite",
      "limit": 30
    },
    {
      "no": 26,
      "type": "mono",
      "audio": "Hello. My name is David. I love my school. We start school at eight and finish at four. My favourite subject is Science. My classmates are very nice. We often play together after school.",
      "ask": "What is David mainly talking about?",
      "options": [
        {
          "t": "His big family."
        },
        {
          "t": "His school life."
        },
        {
          "t": "His busy weekend."
        }
      ],
      "answer": 1,
      "point": "main 主旨要义",
      "limit": 30
    },
    {
      "no": 27,
      "type": "mono",
      "audio": "On Wednesday, I have got four lessons: Chinese, Maths, English and Art. School starts at eight and finishes at three. I have lunch at school with my friends. I always enjoy Wednesday.",
      "ask": "How many lessons does he have on Wednesday?",
      "options": [
        {
          "t": "3."
        },
        {
          "t": "6."
        },
        {
          "t": "4."
        }
      ],
      "answer": 2,
      "point": "事实细节 have got",
      "limit": 30
    },
    {
      "no": 28,
      "type": "mono",
      "audio": "On Wednesday, I have got four lessons: Chinese, Maths, English and Art. School starts at eight and finishes at three. I have lunch at school with my friends. I always enjoy Wednesday.",
      "ask": "Where does he have lunch?",
      "options": [
        {
          "t": "At home."
        },
        {
          "t": "In a library."
        },
        {
          "t": "At school."
        }
      ],
      "answer": 2,
      "point": "infer 抓地点",
      "limit": 30
    },
    {
      "no": 29,
      "type": "mono",
      "audio": "Miss Li is our Maths teacher. She is kind, but she gives us homework every day. I usually finish my homework before dinner. Sometimes it is difficult, but I like her lessons. Maths is fun.",
      "ask": "How does the speaker feel about Maths?",
      "options": [
        {
          "t": "It is fun."
        },
        {
          "t": "It is boring."
        },
        {
          "t": "He hates it."
        }
      ],
      "answer": 0,
      "point": "attitude 观点态度",
      "limit": 30
    },
    {
      "no": 30,
      "type": "mono",
      "audio": "Miss Li is our Maths teacher. She is kind, but she gives us homework every day. I usually finish my homework before dinner. Sometimes it is difficult, but I like her lessons. Maths is fun.",
      "ask": "How often does he get homework?",
      "options": [
        {
          "t": "Every day."
        },
        {
          "t": "Once a week."
        },
        {
          "t": "Never."
        }
      ],
      "answer": 0,
      "point": "infer 频度 every day",
      "limit": 30
    }
  ]
};
