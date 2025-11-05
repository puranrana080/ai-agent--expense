import readline from "node:readline/promises";
import Groq from "groq-sdk";
const expenseDB = [];
const incomeDB = [];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const messages = [
    {
      role: "system",
      content: `You are Josh, a personal finance assistant. Your task is to assist user with their expenses, balances and financial planning.
      You have access to following tools:
      1. getTotalExpense({from,to}):string //get total expense for a time period.
      2. addExpense({name,amount}):string  //add new expense to the expense db.
      3. addIncome({name,amount}):string //add new income to database.
      4. getMoneyBalance():string //get remaining money balance from database.
        currnt datetime: ${new Date().toUTCString()}`,
    },
  ];

  //   this is for user prompt loop
  while (true) {
    const question = await rl.question("User: ");
    if (question === "bye") {
         console.log("Assistant: Goodbye! Keep tracking your expenses wisely! 💰");
      break;
    }
    messages.push({
      role: "user",
      content: question,
    });
    // this is for agent
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
          {
            type: "function",
            function: {
              name: "addIncome",
              description: "Add new income entry to the income database",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the Income. e.g. Got salery",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the income",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getMoneyBalance",
              description: "get remaining money balance from database",
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
        } else if (functionName === "addIncome") {
          result = addIncome(JSON.parse(functionArgs));
        } else if (functionName == "getMoneyBalance") {
          result = getMoneyBalance();
        }

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tool.id,
        });
      }
    }
  }
  rl.close();
}

callAgent();

// get total expense
function getTotalExpense({ from, to }) {
  const expense = expenseDB.reduce((acc, item) => {
    return acc + item.amount;
  }, 0);
  return `${expense} INR`;
}

function addExpense({ name, amount }) {
  expenseDB.push({ name, amount: Number(amount) });
  return "Added to the expense database";
}

function addIncome({ name, amount }) {
  incomeDB.push({ name, amount: Number(amount) });
  return "Added to the income database";
}
function getMoneyBalance() {
  const totalIncome = incomeDB.reduce((acc, item) => acc + item.amount, 0);
  const totalExpense = expenseDB.reduce((acc, item) => acc + item.amount, 0);

  return `${totalIncome - totalExpense} INR`;
}
