const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-2.0-flash";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { question, noteTitle, noteSubject, noteClass, fileName, fileUrl, fileMimeType, fileContent, mode, chatHistory } = body as {
      question?: string;
      noteTitle?: string;
      noteSubject?: string;
      noteClass?: string;
      fileName?: string;
      fileUrl?: string;
      fileMimeType?: string;
      fileContent?: string;
      mode?: 'summarize' | 'questions' | 'chat';
      chatHistory?: ChatMessage[];
    };

    if (mode !== "summarize" && mode !== "questions" && !question?.trim()) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI assistant is not configured. Please contact the administrator to set up the Gemini API key." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt =
      "You are a helpful educational assistant for Maljae Educational Institutions. " +
      "Students, parents, and staff ask you questions about study notes and materials. " +
      "Answer clearly and concisely in a way that helps students understand the material. " +
      "If the question is unrelated to the study material, politely redirect to educational topics.";

    // Build context text from note metadata + any inline text content
    const contextParts: string[] = [];
    if (noteTitle) contextParts.push(`Note Title: ${noteTitle}`);
    if (noteSubject) contextParts.push(`Subject: ${noteSubject}`);
    if (noteClass) contextParts.push(`Class: ${noteClass}`);
    if (fileName) contextParts.push(`File: ${fileName}`);
    if (fileContent) contextParts.push(`File Content (excerpt):\n${fileContent.slice(0, 50000)}`);
    const contextText = contextParts.join("\n");

    // Try to upload file to Gemini File API if we have a URL
    let geminiFileUri: string | null = null;
    let geminiFileMime: string | null = null;

    if (fileUrl) {
      try {
        const fileResp = await fetch(fileUrl);
        if (fileResp.ok) {
          const fileBuffer = await fileResp.arrayBuffer();
          const mimeType = fileMimeType || fileResp.headers.get("content-type") || "application/octet-stream";

          // Gemini File API upload
          const uploadResp = await fetch(
            `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "X-Goog-Upload-Protocol": "raw",
                "X-Goog-Upload-Content-Type": mimeType,
                "Content-Type": mimeType,
              },
              body: fileBuffer,
            },
          );

          if (uploadResp.ok) {
            const uploadData = await uploadResp.json();
            geminiFileUri = uploadData?.file?.uri || null;
            geminiFileMime = uploadData?.file?.mimeType || mimeType;
          }
        }
      } catch (e) {
        console.error("Gemini file upload failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // Build the user prompt
    let userPrompt: string;
    if (mode === "summarize") {
      userPrompt = contextText
        ? `${systemPrompt}\n\nContext from the study material:\n${contextText}\n\nPlease provide a comprehensive summary of the above study material. Highlight key points and important concepts.`
        : `${systemPrompt}\n\nPlease provide a summary of the study material. (No specific material context was provided.)`;
    } else if (mode === "questions") {
      userPrompt = contextText
        ? `${systemPrompt}\n\nContext from the study material:\n${contextText}\n\nBased on the above study material, generate 5 important practice questions that a student should be able to answer. Include brief answers for each question.`
        : `${systemPrompt}\n\nGenerate 5 general practice questions for students. (No specific material context was provided.)`;
    } else {
      userPrompt = contextText
        ? `${systemPrompt}\n\nContext from the study material:\n${contextText}\n\nQuestion: ${question}`
        : `${systemPrompt}\n\nQuestion: ${question}`;
    }

    // Build content parts — include file if uploaded, plus text
    const parts: { text?: string; fileData?: { fileUri: string; mimeType: string } }[] = [];

    if (geminiFileUri && geminiFileMime) {
      parts.push({ fileData: { fileUri: geminiFileUri, mimeType: geminiFileMime } });
    }
    parts.push({ text: userPrompt });

    // Build contents array with chat history if provided
    const contents: { role: string; parts: { text: string }[] }[] = [];
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory.slice(-10)) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({ role: "user", parts: parts as { text: string }[] });

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "The AI assistant encountered an error. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const answer =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response for that question. Please try rephrasing it.";

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("notes-assistant error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
