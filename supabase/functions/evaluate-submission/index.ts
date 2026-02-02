import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvaluationRequest {
  submission_id: string;
  student_answer: string;
  model_answer: string;
  question: string;
  max_marks: number;
  rubric?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submission_id, student_answer, model_answer, question, max_marks, rubric } = 
      await req.json() as EvaluationRequest;

    if (!submission_id || !student_answer || !model_answer) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: submission_id, student_answer, model_answer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Comprehensive evaluation prompt for accurate grading
    const evaluationPrompt = `You are an expert academic evaluator with deep expertise in semantic analysis and educational assessment. Your task is to evaluate a student's answer against a model answer with high accuracy.

## EVALUATION CRITERIA

### 1. SEMANTIC SIMILARITY ANALYSIS (40% weight)
- Compare the core meaning and concepts between student and model answer
- Identify key concepts present in both answers
- Note any missing critical concepts
- Evaluate the depth of understanding demonstrated

### 2. FACTUAL ACCURACY (30% weight)  
- Check for any factually incorrect statements
- Verify all claims against the model answer
- Penalize misinformation appropriately

### 3. COMPLETENESS (20% weight)
- How many key points from the model answer are covered?
- Are all required aspects addressed?
- Is the answer comprehensive?

### 4. CLARITY & EXPRESSION (10% weight)
- Is the answer well-structured and coherent?
- Is the language clear and appropriate?
- Are technical terms used correctly?

## QUESTION
${question}

## MODEL ANSWER (Reference - This is the ideal answer)
${model_answer}

## STUDENT'S ANSWER (To be evaluated)
${student_answer}

${rubric ? `## ADDITIONAL RUBRIC\n${rubric}` : ""}

## MAXIMUM MARKS: ${max_marks}

## YOUR TASK
Provide a detailed evaluation with:
1. A numerical score out of ${max_marks} (be precise - you can use decimals like 7.5)
2. Detailed breakdown of scoring
3. Specific feedback highlighting:
   - What was done well
   - What was missing or incorrect
   - Suggestions for improvement

IMPORTANT: 
- Be fair but rigorous
- Partial credit should be given for partial understanding
- Zero marks only for completely wrong or irrelevant answers
- Perfect score only if answer matches or exceeds model answer quality

Respond in this exact JSON format:
{
  "score": <number between 0 and ${max_marks}>,
  "similarity_percentage": <number between 0 and 100>,
  "key_concepts_matched": <number>,
  "key_concepts_total": <number>,
  "feedback": {
    "strengths": ["list of things done well"],
    "weaknesses": ["list of areas needing improvement"],
    "missing_concepts": ["concepts from model answer not covered"],
    "suggestions": ["specific actionable suggestions"]
  },
  "detailed_feedback": "A comprehensive paragraph explaining the evaluation",
  "confidence": <number between 0 and 1 indicating confidence in evaluation>
}`;

    console.log("Calling Lovable AI for evaluation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "You are an expert academic evaluator. Always respond with valid JSON only, no additional text."
          },
          {
            role: "user",
            content: evaluationPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent grading
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI evaluation failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    console.log("AI Response:", content);

    // Parse the JSON response
    let evaluation;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      evaluation = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: try to extract score from text
      const scoreMatch = content.match(/score["\s:]+(\d+\.?\d*)/i);
      evaluation = {
        score: scoreMatch ? parseFloat(scoreMatch[1]) : max_marks * 0.5,
        similarity_percentage: 50,
        detailed_feedback: content,
        confidence: 0.5
      };
    }

    // Ensure score is within bounds
    const finalScore = Math.min(Math.max(evaluation.score || 0, 0), max_marks);
    const similarityScore = evaluation.similarity_percentage || 
                           Math.round((finalScore / max_marks) * 100);

    // Build comprehensive feedback string
    let feedbackText = evaluation.detailed_feedback || "";
    if (evaluation.feedback) {
      const fb = evaluation.feedback;
      if (fb.strengths?.length) {
        feedbackText += `\n\n**Strengths:** ${fb.strengths.join("; ")}`;
      }
      if (fb.weaknesses?.length) {
        feedbackText += `\n\n**Areas for Improvement:** ${fb.weaknesses.join("; ")}`;
      }
      if (fb.suggestions?.length) {
        feedbackText += `\n\n**Suggestions:** ${fb.suggestions.join("; ")}`;
      }
    }

    // Store evaluation in database
    const { data: existingEval } = await supabase
      .from("evaluations")
      .select("id")
      .eq("submission_id", submission_id)
      .single();

    if (existingEval) {
      // Update existing evaluation
      const { error: updateError } = await supabase
        .from("evaluations")
        .update({
          ai_suggested_marks: finalScore,
          ai_feedback: feedbackText,
          ai_similarity_score: similarityScore / 100,
          is_ai_evaluated: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingEval.id);

      if (updateError) {
        console.error("Error updating evaluation:", updateError);
      }
    } else {
      // Create new evaluation
      const { error: insertError } = await supabase
        .from("evaluations")
        .insert({
          submission_id,
          ai_suggested_marks: finalScore,
          ai_feedback: feedbackText,
          ai_similarity_score: similarityScore / 100,
          is_ai_evaluated: true,
          is_faculty_approved: false,
        });

      if (insertError) {
        console.error("Error inserting evaluation:", insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        evaluation: {
          score: finalScore,
          max_marks,
          similarity_percentage: similarityScore,
          feedback: feedbackText,
          key_concepts_matched: evaluation.key_concepts_matched,
          key_concepts_total: evaluation.key_concepts_total,
          confidence: evaluation.confidence || 0.8,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Evaluation failed",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
