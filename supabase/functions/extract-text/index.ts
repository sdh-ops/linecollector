// Supabase Edge Function: extract-text
// Deploy with: supabase functions deploy extract-text

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
        const { imageBase64 } = await req.json();

        // Extract mime type and base64 data correctly
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid image base64 format');
        }
        const mimeType = matches[1];
        const base64Data = matches[2];

        const prompt = `
      첨부된 이미지에서 책이나 문서의 본문 텍스트만 추출해 줘.
      - 단순한 줄바꿈은 무시하고 자연스러운 하나의 문단으로 이어지게 보정할 것.
      - 오타나 노이즈가 보이면 문맥에 맞게 완벽한 한국어(또는 해당 언어) 문장으로 교정할 것.
      - 여러 언어가 섞여 있어도 번역하지 말고 원문 그대로 추출할 것.
      - 결과로 추출된 순수 텍스트만 출력할 것 (글머리 기호, 마크다운, 따옴표 등 추가 설명 일절 제외).
    `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                    }
                }),
            }
        );

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        // Make sure we get text property
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return new Response(JSON.stringify({ text: resultText.trim() }), {
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
