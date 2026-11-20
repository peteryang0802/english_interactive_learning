// 第4关 Unit 3 Home and Places 家与地点（10 单句 | 12 长对话 | 8 独白；16 事实 | 14 高阶）
export const unit3 = {
  "id": "unit3",
  "title": "Unit 3 Home and Places 家与地点",
  "questions": [
    {
      "no": 1,
      "type": "choose",
      "audio": "This is our kitchen. We cook here.",
      "options": [
        {
          "t": "浴室",
          "img": "bathroom"
        },
        {
          "t": "卧室",
          "img": "bedroom"
        },
        {
          "t": "厨房",
          "img": "kitchen"
        }
      ],
      "answer": 2,
      "point": "kitchen",
      "limit": 20
    },
    {
      "no": 2,
      "type": "choose",
      "audio": "The bathroom is next to my bedroom.",
      "options": [
        {
          "t": "客厅",
          "img": "living-room"
        },
        {
          "t": "浴室",
          "img": "bathroom"
        },
        {
          "t": "厨房",
          "img": "kitchen"
        }
      ],
      "answer": 1,
      "point": "bathroom / next to",
      "limit": 20
    },
    {
      "no": 3,
      "type": "choose",
      "audio": "We watch TV in the living room.",
      "options": [
        {
          "t": "客厅",
          "img": "living-room"
        },
        {
          "t": "卧室",
          "img": "bedroom"
        },
        {
          "t": "书房",
          "img": "study"
        }
      ],
      "answer": 0,
      "point": "living room",
      "limit": 20
    },
    {
      "no": 4,
      "type": "choose",
      "audio": "I want to buy some food in the supermarket.",
      "options": [
        {
          "t": "超市",
          "img": "supermarket"
        },
        {
          "t": "银行",
          "img": "bank"
        },
        {
          "t": "医院",
          "img": "hospital"
        }
      ],
      "answer": 0,
      "point": "supermarket",
      "limit": 20
    },
    {
      "no": 5,
      "type": "response",
      "audio": "Where is my bag?",
      "options": [
        {
          "t": "It is behind the door."
        },
        {
          "t": "It is red."
        },
        {
          "t": "It is new."
        }
      ],
      "answer": 0,
      "point": "where + 方位",
      "limit": 20
    },
    {
      "no": 6,
      "type": "response",
      "audio": "Is there a bank near here?",
      "options": [
        {
          "t": "Yes, it is."
        },
        {
          "t": "Yes, I have."
        },
        {
          "t": "Yes, there is."
        }
      ],
      "answer": 2,
      "point": "there be 回答",
      "limit": 20
    },
    {
      "no": 7,
      "type": "response",
      "audio": "Where can I read books?",
      "options": [
        {
          "t": "In the library."
        },
        {
          "t": "At seven."
        },
        {
          "t": "With my mum."
        }
      ],
      "answer": 0,
      "point": "where 问场所",
      "limit": 20
    },
    {
      "no": 8,
      "type": "judge",
      "screen": {
        "img": "cat-under-chair",
        "t": "猫在椅子下"
      },
      "audio": "The cat is under the chair.",
      "options": [
        {
          "t": "对"
        },
        {
          "t": "错"
        }
      ],
      "answer": 0,
      "point": "方位 under",
      "limit": 20
    },
    {
      "no": 9,
      "type": "judge",
      "screen": {
        "img": "bank",
        "t": "一家银行"
      },
      "audio": "This is a supermarket.",
      "options": [
        {
          "t": "对"
        },
        {
          "t": "错"
        }
      ],
      "answer": 1,
      "point": "场所辨义",
      "limit": 20
    },
    {
      "no": 10,
      "type": "info",
      "audio": "The library is between the bank and the supermarket.",
      "options": [
        {
          "t": "银行和超市之间",
          "img": "between"
        },
        {
          "t": "公园旁边",
          "img": "near-park"
        },
        {
          "t": "医院后面",
          "img": "behind-hospital"
        }
      ],
      "answer": 0,
      "point": "between 方位",
      "limit": 20
    },
    {
      "no": 11,
      "type": "dialog",
      "audio": [
        "Excuse me. Where is the hospital?",
        "Go straight, and turn left at the bank.",
        "Is it far from here?",
        "No. It is next to the bank. You can walk there."
      ],
      "ask": "Where is the hospital?",
      "options": [
        {
          "t": "Behind the library."
        },
        {
          "t": "Next to the bank."
        },
        {
          "t": "Near the park."
        }
      ],
      "answer": 1,
      "point": "事实细节 地点",
      "limit": 30
    },
    {
      "no": 12,
      "type": "dialog",
      "audio": [
        "Excuse me. Where is the hospital?",
        "Go straight, and turn left at the bank.",
        "Is it far from here?",
        "No. It is next to the bank. You can walk there."
      ],
      "ask": "How can the man get to the hospital?",
      "options": [
        {
          "t": "By bus."
        },
        {
          "t": "By train."
        },
        {
          "t": "On foot."
        }
      ],
      "answer": 2,
      "point": "infer 推断出行方式（walk）",
      "limit": 30
    },
    {
      "no": 13,
      "type": "dialog",
      "audio": [
        "What is in your bedroom?",
        "There is a big bed, a desk and a chair.",
        "Are there any books?",
        "Yes. There are many books on the desk."
      ],
      "ask": "What is on the desk?",
      "options": [
        {
          "t": "A football."
        },
        {
          "t": "Many books."
        },
        {
          "t": "Two chairs."
        }
      ],
      "answer": 1,
      "point": "事实细节 there be",
      "limit": 30
    },
    {
      "no": 14,
      "type": "dialog",
      "audio": [
        "What is in your bedroom?",
        "There is a big bed, a desk and a chair.",
        "Are there any books?",
        "Yes. There are many books on the desk."
      ],
      "ask": "Which is true about the bedroom?",
      "options": [
        {
          "t": "There is a bed and a desk."
        },
        {
          "t": "There are no books."
        },
        {
          "t": "There is a kitchen in it."
        }
      ],
      "answer": 0,
      "point": "infer 综合判断",
      "limit": 30
    },
    {
      "no": 15,
      "type": "dialog",
      "audio": [
        "Where is the supermarket?",
        "It is between the library and the bank.",
        "Is there a bus stop near it?",
        "Yes, just in front of the supermarket."
      ],
      "ask": "Where is the supermarket?",
      "options": [
        {
          "t": "Between the library and the bank."
        },
        {
          "t": "Behind the hospital."
        },
        {
          "t": "Next to the park."
        }
      ],
      "answer": 0,
      "point": "事实细节 between",
      "limit": 30
    },
    {
      "no": 16,
      "type": "dialog",
      "audio": [
        "Where is the supermarket?",
        "It is between the library and the bank.",
        "Is there a bus stop near it?",
        "Yes, just in front of the supermarket."
      ],
      "ask": "What is in front of the supermarket?",
      "options": [
        {
          "t": "A small park."
        },
        {
          "t": "A bus stop."
        },
        {
          "t": "A big library."
        }
      ],
      "answer": 1,
      "point": "infer 抓 in front of",
      "limit": 30
    },
    {
      "no": 17,
      "type": "dialog",
      "audio": [
        "Mum, I cannot find my football.",
        "Is it in your bedroom?",
        "No. I looked there.",
        "Look behind the living room door. It is often there."
      ],
      "ask": "Where is the football probably?",
      "options": [
        {
          "t": "In the bathroom."
        },
        {
          "t": "On the kitchen table."
        },
        {
          "t": "Behind the living room door."
        }
      ],
      "answer": 2,
      "point": "infer 推断位置",
      "limit": 30
    },
    {
      "no": 18,
      "type": "dialog",
      "audio": [
        "Mum, I cannot find my football.",
        "Is it in your bedroom?",
        "No. I looked there.",
        "Look behind the living room door. It is often there."
      ],
      "ask": "What are they doing?",
      "options": [
        {
          "t": "Looking for a football."
        },
        {
          "t": "Buying some food."
        },
        {
          "t": "Cleaning the kitchen."
        }
      ],
      "answer": 0,
      "point": "intent 说话意图",
      "limit": 30
    },
    {
      "no": 19,
      "type": "dialog",
      "audio": [
        "Do you like your new flat?",
        "Yes. It has three bedrooms and a big living room.",
        "Which room do you like best?",
        "The kitchen. We make nice food together there."
      ],
      "ask": "What are they mainly talking about?",
      "options": [
        {
          "t": "The school day."
        },
        {
          "t": "The new flat."
        },
        {
          "t": "A family photo."
        }
      ],
      "answer": 1,
      "point": "main 主旨要义",
      "limit": 30
    },
    {
      "no": 20,
      "type": "dialog",
      "audio": [
        "Do you like your new flat?",
        "Yes. It has three bedrooms and a big living room.",
        "Which room do you like best?",
        "The kitchen. We make nice food together there."
      ],
      "ask": "Which is the speaker's favourite room?",
      "options": [
        {
          "t": "The bathroom."
        },
        {
          "t": "The bedroom."
        },
        {
          "t": "The kitchen."
        }
      ],
      "answer": 2,
      "point": "attitude 喜好态度",
      "limit": 30
    },
    {
      "no": 21,
      "type": "dialog",
      "audio": [
        "What can you see in the kitchen?",
        "There is a table and four chairs.",
        "Is there a fridge?",
        "Yes. There is a big fridge near the window."
      ],
      "ask": "How many chairs are there?",
      "options": [
        {
          "t": "2."
        },
        {
          "t": "6."
        },
        {
          "t": "4."
        }
      ],
      "answer": 2,
      "point": "事实细节 数量（就近 there is）",
      "limit": 30
    },
    {
      "no": 22,
      "type": "dialog",
      "audio": [
        "What can you see in the kitchen?",
        "There is a table and four chairs.",
        "Is there a fridge?",
        "Yes. There is a big fridge near the window."
      ],
      "ask": "What are they talking about?",
      "options": [
        {
          "t": "Lessons at school."
        },
        {
          "t": "Things in a kitchen."
        },
        {
          "t": "Places in a park."
        }
      ],
      "answer": 1,
      "point": "main 主旨要义",
      "limit": 30
    },
    {
      "no": 23,
      "type": "mono",
      "audio": "Hello. My name is Sam. This is my house. There is a living room, a kitchen and two bedrooms. My favourite room is my bedroom. It is small but nice. There is a big window in it.",
      "ask": "How many bedrooms are there in the house?",
      "options": [
        {
          "t": "2."
        },
        {
          "t": "3."
        },
        {
          "t": "1."
        }
      ],
      "answer": 0,
      "point": "事实细节 数量",
      "limit": 30
    },
    {
      "no": 24,
      "type": "mono",
      "audio": "Hello. My name is Sam. This is my house. There is a living room, a kitchen and two bedrooms. My favourite room is my bedroom. It is small but nice. There is a big window in it.",
      "ask": "What is Sam mainly talking about?",
      "options": [
        {
          "t": "His school."
        },
        {
          "t": "His house."
        },
        {
          "t": "His family."
        }
      ],
      "answer": 1,
      "point": "main 主旨要义",
      "limit": 30
    },
    {
      "no": 25,
      "type": "mono",
      "audio": "Welcome to my neighbourhood. There is a supermarket, a bank and a library near my home. The library is my favourite place. It is between the bank and a small park. I often read there after school.",
      "ask": "What is between the bank and the park?",
      "options": [
        {
          "t": "The library."
        },
        {
          "t": "The hospital."
        },
        {
          "t": "The supermarket."
        }
      ],
      "answer": 0,
      "point": "事实细节 between",
      "limit": 30
    },
    {
      "no": 26,
      "type": "mono",
      "audio": "Welcome to my neighbourhood. There is a supermarket, a bank and a library near my home. The library is my favourite place. It is between the bank and a small park. I often read there after school.",
      "ask": "Where does Sam often read?",
      "options": [
        {
          "t": "In the kitchen."
        },
        {
          "t": "At the bank."
        },
        {
          "t": "In the library."
        }
      ],
      "answer": 2,
      "point": "infer 抓地点",
      "limit": 30
    },
    {
      "no": 27,
      "type": "mono",
      "audio": "This is my bedroom. My bed is next to the window. My desk is between the bed and the door. There is a lamp on the desk. Under the desk is my chair. I love reading and doing homework in this room.",
      "ask": "Where is the desk?",
      "options": [
        {
          "t": "Next to the window."
        },
        {
          "t": "Under the chair."
        },
        {
          "t": "Between the bed and the door."
        }
      ],
      "answer": 2,
      "point": "infer 方位推断",
      "limit": 30
    },
    {
      "no": 28,
      "type": "mono",
      "audio": "This is my bedroom. My bed is next to the window. My desk is between the bed and the door. There is a lamp on the desk. Under the desk is my chair. I love reading and doing homework in this room.",
      "ask": "How does the speaker feel about the room?",
      "options": [
        {
          "t": "He dislikes it."
        },
        {
          "t": "He never uses it."
        },
        {
          "t": "He loves it."
        }
      ],
      "answer": 2,
      "point": "attitude 观点态度",
      "limit": 30
    },
    {
      "no": 29,
      "type": "mono",
      "audio": "Our school is near a big hospital. In front of the school there is a library. Between the school and the library there is a small shop. There are many trees behind the school. It is a nice place to study.",
      "ask": "What is in front of the school?",
      "options": [
        {
          "t": "A hospital."
        },
        {
          "t": "A library."
        },
        {
          "t": "A small shop."
        }
      ],
      "answer": 1,
      "point": "infer 抓 in front of",
      "limit": 30
    },
    {
      "no": 30,
      "type": "mono",
      "audio": "Our school is near a big hospital. In front of the school there is a library. Between the school and the library there is a small shop. There are many trees behind the school. It is a nice place to study.",
      "ask": "What is the speaker mainly describing?",
      "options": [
        {
          "t": "The lessons at school."
        },
        {
          "t": "The places around the school."
        },
        {
          "t": "The teacher at school."
        }
      ],
      "answer": 1,
      "point": "main 主旨要义",
      "limit": 30
    }
  ]
};
