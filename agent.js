import Groq from "groq-sdk";
const expenseDB = [];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const messages = [
    {
      role: "system",
      content: `You are Josh, a personel finance assistant. Your task is to assist user with their expenses, balances and financial planning.
        currnt datetime: ${new Date().toUTCString()}`,
    },
  ];
  messages.push({
    role: "user",
    content: "hey , i just bought mac m1 for 60000 inr",
  });

  while (true) {
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "openai/gpt-oss-20b",
      tools: [
        {
          type: "function",
          function: {
            name: "getTotalExpense",
            description: "Get total expense from date to date",
            parameters: {
              type: "object",
              properties: {
                from: {
                  type: "string",
                  description: "from date to get the expense",
                },
                to: {
                  type: "string",
                  description: "to date to get expense",
                },
              },
            },
          },
        },
        {
          type: "function",
          function: {
            name: "addExpense",
            description: "Add new expense entry to the expense database",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description:
                    "Name of the expense. e.g. bought an iphone for 5000 inr",
                },
                amount: {
                  type: "string",
                  description: "Amount of the expense",
                },
              },
            },
          },
        },
      ],
    });

    messages.push(completion.choices[0].message);

    const toolCalls = completion.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log(`Assistant: ${completion.choices[0].message.content}`);
      break;
    }
    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const functionArgs = tool.function.arguments;

      let result = "";
      if (functionName === "getTotalExpense") {
        result = getTotalExpense(JSON.parse(functionArgs));
      } else if (functionName === "addExpense") {
        result = addExpense(JSON.parse(functionArgs));
      }
      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      });
      console.log("===========================");
      console.log("Messages", messages);
      console.log("===========================");
      console.log("DB: ", expenseDB);
    }
  }
}

callAgent();

// get total expense
function getTotalExpense({ from, to }) {
  console.log("Calling getTotalExpense tool");
  // In reality db will be called
  const expense = expenseDB.reduce((acc, item) => {
    return acc + item.amount;
  }, 0);
  return `${expense} INR`;
}

function addExpense({ name, amount }) {
  console.log(`Adding ${amount} to expense db for ${name}`);
  expenseDB.push({ name, amount });
  return "Added to the database";
}
