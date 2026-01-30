import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimetableRequest {
  courseId: string;
  semester: number;
  section: string;
  academicYear: string;
  subjects: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    isLab: boolean;
  }>;
  faculty: Array<{
    id: string;
    name: string;
    employeeId: string;
  }>;
  constraints?: {
    maxPeriodsPerDay?: number;
    lunchStart?: string;
    lunchEnd?: string;
    startTime?: string;
    endTime?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile to verify faculty access
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.user_type !== 'faculty') {
      console.error('Profile error or not faculty:', profileError);
      return new Response(
        JSON.stringify({ error: 'Access denied. Faculty only.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: TimetableRequest = await req.json();
    console.log('Generating timetable for:', requestData.courseId, 'Semester:', requestData.semester);

    // Default time slots
    const timeSlots = [
      { start: '09:00', end: '09:50' },
      { start: '09:50', end: '10:40' },
      { start: '10:50', end: '11:40' },
      { start: '11:40', end: '12:30' },
      { start: '12:30', end: '13:20', isLunch: true },
      { start: '13:20', end: '14:10' },
      { start: '14:10', end: '15:00' },
      { start: '15:10', end: '16:00' },
      { start: '16:00', end: '16:50' },
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Build prompt for AI
    const prompt = `You are an academic timetable scheduler. Create an optimized weekly timetable based on the following constraints:

SUBJECTS:
${requestData.subjects.map(s => `- ${s.code}: ${s.name} (${s.credits} credits, ${s.isLab ? 'Lab' : 'Theory'})`).join('\n')}

FACULTY:
${requestData.faculty.map(f => `- ${f.employeeId}: ${f.name}`).join('\n')}

TIME SLOTS:
${timeSlots.filter(t => !t.isLunch).map(t => `${t.start} - ${t.end}`).join(', ')}

CONSTRAINTS:
1. Each subject should appear based on its credits (roughly credits × 1.5 periods per week)
2. Labs should be 2 consecutive periods
3. Distribute subjects evenly across the week
4. No same subject twice in a day (unless it's a lab)
5. Lunch break is 12:30-13:20
6. Weekend (Saturday) can have fewer classes

Return a JSON array of slot assignments in this format:
{
  "slots": [
    {
      "day": 0, // 0=Monday, 5=Saturday
      "startTime": "09:00",
      "endTime": "09:50",
      "subjectId": "subject-uuid",
      "facultyId": "faculty-uuid",
      "room": "Room 101",
      "type": "lecture" // or "lab"
    }
  ]
}

Generate a complete timetable covering all 6 days with appropriate distribution.`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an academic timetable scheduler. Always respond with valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      
      // Fallback to algorithmic generation
      console.log('Falling back to algorithmic timetable generation');
      return generateAlgorithmicTimetable(requestData, timeSlots, days, corsHeaders);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let generatedSlots;
    try {
      const content = aiData.choices[0].message.content;
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedSlots = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return generateAlgorithmicTimetable(requestData, timeSlots, days, corsHeaders);
    }

    return new Response(
      JSON.stringify({
        success: true,
        method: 'ai',
        timetable: generatedSlots,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-timetable:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateAlgorithmicTimetable(
  requestData: TimetableRequest,
  timeSlots: Array<{ start: string; end: string; isLunch?: boolean }>,
  days: string[],
  corsHeaders: Record<string, string>
) {
  const slots: any[] = [];
  const { subjects, faculty } = requestData;
  
  if (!subjects.length) {
    return new Response(
      JSON.stringify({
        success: true,
        method: 'algorithmic',
        timetable: { slots: [] },
        message: 'No subjects to schedule',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate periods needed per subject
  const subjectPeriods = subjects.map(s => ({
    ...s,
    periodsNeeded: Math.ceil(s.credits * 1.5),
    periodsAssigned: 0,
  }));

  let subjectIndex = 0;
  let facultyIndex = 0;
  let roomNumber = 101;

  for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
    for (const timeSlot of timeSlots) {
      if (timeSlot.isLunch) {
        slots.push({
          day: dayIndex,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          subjectId: null,
          facultyId: null,
          room: null,
          type: 'lunch',
        });
        continue;
      }

      // Find next subject that needs periods
      let attempts = 0;
      while (attempts < subjects.length) {
        const subject = subjectPeriods[subjectIndex % subjectPeriods.length];
        if (subject.periodsAssigned < subject.periodsNeeded) {
          const assignedFaculty = faculty[facultyIndex % Math.max(faculty.length, 1)];
          
          slots.push({
            day: dayIndex,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            subjectId: subject.id,
            facultyId: assignedFaculty?.id || null,
            room: subject.isLab ? `Lab ${(roomNumber % 5) + 1}` : `Room ${roomNumber}`,
            type: subject.isLab ? 'lab' : 'lecture',
          });

          subject.periodsAssigned++;
          roomNumber++;
          break;
        }
        subjectIndex++;
        attempts++;
      }

      subjectIndex++;
      if (dayIndex % 2 === 0) facultyIndex++;
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      method: 'algorithmic',
      timetable: { slots },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
