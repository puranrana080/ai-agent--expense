import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent(){
    const completion =await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Who are you ?",
      },
    ],
    model: "openai/gpt-oss-20b",
  });

  console.log(JSON.stringify(completion.choices[0],null,2))
   

}

callAgent()

