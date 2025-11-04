import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are Josh, a personel finance assistant. Your task is to assist user with their expenses, balances and financial planning.
        currnt datetime: ${new Date().toUTCString()}`,
      },
      {
        role: "user",
        content: "How much money i have spend this month?",
      },
    ],
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
    ],
  });

  console.log(JSON.stringify(completion.choices[0], null, 2));


  const toolCalls=completion.choices[0].message.tool_calls
  if(!toolCalls){
    console.log(`Assistant: ${completion.choices[0].message.content}`)
    return 
  }
  for(const tool of toolCalls){
    const functionName = tool.function.name
    const functionArgs = tool.function.arguments

let result=""
    if(functionName==='getTotalExpense'){
        result = getTotalExpense(JSON.parse(functionArgs))

    }

    console.log("result",result)
  }

 
}

callAgent();

// get total expense

function getTotalExpense({ from, to }) {
  console.log("Calling getTotalExpense tool");
  // In reality db will be called
  return '10000';
}
