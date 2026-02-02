import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { assignment_id } = await req.json();

    if (!assignment_id) {
      return new Response(
        JSON.stringify({ error: "Missing assignment_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch assignment details including model answer
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("id, title, description, model_answer_url, max_marks")
      .eq("id", assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: "Assignment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!assignment.model_answer_url) {
      return new Response(
        JSON.stringify({ error: "No model answer configured for this assignment. Please upload a model answer first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all pending submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select(`
        id,
        submitted_text,
        student_id,
        evaluations (id, is_faculty_approved)
      `)
      .eq("assignment_id", assignment_id);

    if (submissionsError) {
      throw submissionsError;
    }

    // Filter to only unevaluated submissions
    const pendingSubmissions = (submissions || []).filter(
      (s: any) => !s.evaluations?.[0]?.is_faculty_approved
    );

    if (pendingSubmissions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending submissions to evaluate",
          evaluated_count: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch model answer content (assuming it's stored as text or we need to extract)
    // For now, we'll use the description + model_answer_url as the model answer
    const modelAnswer = assignment.model_answer_url; // This should contain the model answer text

    const results = {
      evaluated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each submission
    for (const submission of pendingSubmissions) {
      if (!submission.submitted_text) {
        results.failed++;
        results.errors.push(`Submission ${submission.id}: No submitted text`);
        continue;
      }

      try {
        // Call the evaluate-submission function
        const evalResponse = await fetch(`${supabaseUrl}/functions/v1/evaluate-submission`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submission_id: submission.id,
            student_answer: submission.submitted_text,
            model_answer: modelAnswer,
            question: assignment.title + (assignment.description ? `\n${assignment.description}` : ""),
            max_marks: assignment.max_marks,
          }),
        });

        if (evalResponse.ok) {
          results.evaluated++;
        } else {
          results.failed++;
          const errorData = await evalResponse.json().catch(() => ({}));
          results.errors.push(`Submission ${submission.id}: ${errorData.error || "Unknown error"}`);
        }

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.failed++;
        results.errors.push(`Submission ${submission.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_submissions: pendingSubmissions.length,
        evaluated_count: results.evaluated,
        failed_count: results.failed,
        errors: results.errors.slice(0, 5), // Only return first 5 errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Batch evaluation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Batch evaluation failed",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
