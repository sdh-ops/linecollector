// Supabase Edge Function: analyze-sentence
// Deploy with: supabase functions deploy analyze-sentence

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { content } = await req.json();

        const prompt = `
      문장 내용을 분석하여 적절한 태그 3개와 카테고리를 하나 정해줘.
      결과는 반드시 JSON 형식으로만 답해줘.
      형식: {"tags": ["태그1", "태그2", "태그3"], "category": "카테고리명"}
      
      카테고리는 반드시 다음 중 하나여야 함: [인문, 사회, 과학, 문학, 소설, 에세이, 자기계발, 경제경영, 예술, 기타]
      
      문장: "${content}"
    `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        response_mime_type: "application/json",
                    }
                }),
            }
        );

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(resultText);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
