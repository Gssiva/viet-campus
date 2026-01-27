import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoUser {
  email: string;
  password: string;
  profile: {
    first_name: string;
    last_name: string;
    user_type: 'student' | 'faculty' | 'parent';
    roll_number?: string;
    employee_id?: string;
    department_id?: string;
    course_id?: string;
    current_semester?: number;
    batch_year?: number;
    section?: string;
    linked_student_id?: string;
  };
  roles?: { role: string; department_id?: string }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const demoUsers: DemoUser[] = [
      // Students
      {
        email: '21a51a0501@viet.student.edu.in',
        password: 'viet@2026',
        profile: {
          first_name: 'Rahul',
          last_name: 'Kumar',
          user_type: 'student',
          roll_number: '21A51A0501',
          department_id: 'd1a1a1a1-1111-1111-1111-111111111111',
          course_id: 'c1a1a1a1-1111-1111-1111-111111111111',
          current_semester: 5,
          batch_year: 2021,
          section: 'A'
        }
      },
      {
        email: '21a51a0502@viet.student.edu.in',
        password: 'viet@2026',
        profile: {
          first_name: 'Priya',
          last_name: 'Sharma',
          user_type: 'student',
          roll_number: '21A51A0502',
          department_id: 'd1a1a1a1-1111-1111-1111-111111111111',
          course_id: 'c1a1a1a1-1111-1111-1111-111111111111',
          current_semester: 5,
          batch_year: 2021,
          section: 'A'
        }
      },
      {
        email: '22a51a0401@viet.student.edu.in',
        password: 'viet@2026',
        profile: {
          first_name: 'Amit',
          last_name: 'Patel',
          user_type: 'student',
          roll_number: '22A51A0401',
          department_id: 'd2a2a2a2-2222-2222-2222-222222222222',
          course_id: 'c2a2a2a2-2222-2222-2222-222222222222',
          current_semester: 3,
          batch_year: 2022,
          section: 'A'
        }
      },
      // Faculty - Administration
      {
        email: 'emp001@viet.faculty.edu.in',
        password: 'vietvsp@2026',
        profile: {
          first_name: 'Dr. Ramesh',
          last_name: 'Verma',
          user_type: 'faculty',
          employee_id: 'EMP001',
          department_id: 'd1a1a1a1-1111-1111-1111-111111111111'
        },
        roles: [{ role: 'administration' }]
      },
      // Faculty - HOD CSE
      {
        email: 'emp002@viet.faculty.edu.in',
        password: 'vietvsp@2026',
        profile: {
          first_name: 'Dr. Sunita',
          last_name: 'Reddy',
          user_type: 'faculty',
          employee_id: 'EMP002',
          department_id: 'd1a1a1a1-1111-1111-1111-111111111111'
        },
        roles: [{ role: 'hod', department_id: 'd1a1a1a1-1111-1111-1111-111111111111' }]
      },
      // Faculty - Teaching
      {
        email: 'emp003@viet.faculty.edu.in',
        password: 'vietvsp@2026',
        profile: {
          first_name: 'Prof. Vijay',
          last_name: 'Singh',
          user_type: 'faculty',
          employee_id: 'EMP003',
          department_id: 'd1a1a1a1-1111-1111-1111-111111111111'
        },
        roles: [{ role: 'teaching', department_id: 'd1a1a1a1-1111-1111-1111-111111111111' }]
      },
      // Faculty - Accounts
      {
        email: 'emp004@viet.faculty.edu.in',
        password: 'vietvsp@2026',
        profile: {
          first_name: 'Lakshmi',
          last_name: 'Naidu',
          user_type: 'faculty',
          employee_id: 'EMP004',
          department_id: 'd1a1a1a1-1111-1111-1111-111111111111'
        },
        roles: [{ role: 'accounts' }]
      },
      // Faculty - Non-Teaching
      {
        email: 'emp005@viet.faculty.edu.in',
        password: 'vietvsp@2026',
        profile: {
          first_name: 'Ravi',
          last_name: 'Teja',
          user_type: 'faculty',
          employee_id: 'EMP005',
          department_id: 'd1a1a1a1-1111-1111-1111-111111111111'
        },
        roles: [{ role: 'non_teaching', department_id: 'd1a1a1a1-1111-1111-1111-111111111111' }]
      }
    ]

    const results: { email: string; status: string; error?: string }[] = []
    const createdStudents: { id: string; roll_number: string }[] = []

    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === user.email)
        
        let userId: string

        if (existingUser) {
          userId = existingUser.id
          results.push({ email: user.email, status: 'already exists' })
        } else {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true
          })

          if (authError) {
            results.push({ email: user.email, status: 'error', error: authError.message })
            continue
          }

          userId = authData.user.id
          results.push({ email: user.email, status: 'created' })
        }

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single()

        let profileId: string

        if (existingProfile) {
          profileId = existingProfile.id
        } else {
          // Create profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              email: user.email,
              ...user.profile,
              is_first_login: false
            })
            .select('id')
            .single()

          if (profileError) {
            console.error('Profile error:', profileError)
            continue
          }

          profileId = profileData.id
        }

        // Track student IDs for parent linking
        if (user.profile.user_type === 'student' && user.profile.roll_number) {
          createdStudents.push({ id: profileId, roll_number: user.profile.roll_number })
        }

        // Create roles if faculty
        if (user.roles && user.roles.length > 0) {
          for (const role of user.roles) {
            const { error: roleError } = await supabase
              .from('faculty_roles')
              .upsert({
                user_id: userId,
                role: role.role,
                department_id: role.department_id || null
              }, { onConflict: 'user_id,role' })

            if (roleError) {
              console.error('Role error:', roleError)
            }
          }
        }

      } catch (error) {
        results.push({ email: user.email, status: 'error', error: String(error) })
      }
    }

    // Create parent users linked to students
    for (const student of createdStudents) {
      const parentEmail = `${student.roll_number.toLowerCase()}.parent@viet.edu.in`
      
      try {
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingParent = existingUsers?.users?.find(u => u.email === parentEmail)
        
        let parentUserId: string

        if (existingParent) {
          parentUserId = existingParent.id
          results.push({ email: parentEmail, status: 'already exists' })
        } else {
          const { data: parentAuth, error: parentAuthError } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password: 'parent@2026',
            email_confirm: true
          })

          if (parentAuthError) {
            results.push({ email: parentEmail, status: 'error', error: parentAuthError.message })
            continue
          }

          parentUserId = parentAuth.user.id
          results.push({ email: parentEmail, status: 'created' })
        }

        // Check if parent profile exists
        const { data: existingParentProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', parentUserId)
          .single()

        if (!existingParentProfile) {
          await supabase
            .from('profiles')
            .insert({
              user_id: parentUserId,
              email: parentEmail,
              first_name: 'Parent of',
              last_name: student.roll_number,
              user_type: 'parent',
              linked_student_id: student.id,
              is_first_login: false
            })
        }

      } catch (error) {
        results.push({ email: parentEmail, status: 'error', error: String(error) })
      }
    }

    // Assign faculty to subjects
    const { data: teachingFaculty } = await supabase
      .from('profiles')
      .select('id, employee_id')
      .eq('employee_id', 'EMP003')
      .single()

    if (teachingFaculty) {
      await supabase
        .from('faculty_subjects')
        .upsert([
          { faculty_id: teachingFaculty.id, subject_id: 'a1b1c1d1-1111-1111-1111-111111111111', academic_year: '2025-26', section: 'A' },
          { faculty_id: teachingFaculty.id, subject_id: 'a2b2c2d2-2222-2222-2222-222222222222', academic_year: '2025-26', section: 'A' },
          { faculty_id: teachingFaculty.id, subject_id: 'a5b5c5d5-5555-5555-5555-555555555555', academic_year: '2025-26', section: 'A' }
        ], { onConflict: 'faculty_id,subject_id,academic_year' })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo users seeded successfully',
        results,
        demo_logins: {
          students: [
            { roll_number: '21A51A0501', password: 'viet@2026', name: 'Rahul Kumar (CSE, Sem 5)' },
            { roll_number: '21A51A0502', password: 'viet@2026', name: 'Priya Sharma (CSE, Sem 5)' },
            { roll_number: '22A51A0401', password: 'viet@2026', name: 'Amit Patel (ECE, Sem 3)' }
          ],
          faculty: [
            { employee_id: 'EMP001', password: 'vietvsp@2026', name: 'Dr. Ramesh Verma', role: 'Administration' },
            { employee_id: 'EMP002', password: 'vietvsp@2026', name: 'Dr. Sunita Reddy', role: 'HOD (CSE)' },
            { employee_id: 'EMP003', password: 'vietvsp@2026', name: 'Prof. Vijay Singh', role: 'Teaching Faculty' },
            { employee_id: 'EMP004', password: 'vietvsp@2026', name: 'Lakshmi Naidu', role: 'Accounts' },
            { employee_id: 'EMP005', password: 'vietvsp@2026', name: 'Ravi Teja', role: 'Non-Teaching' }
          ],
          parents: [
            { student_roll: '21A51A0501', password: 'parent@2026', linked_to: 'Rahul Kumar' },
            { student_roll: '21A51A0502', password: 'parent@2026', linked_to: 'Priya Sharma' },
            { student_roll: '22A51A0401', password: 'parent@2026', linked_to: 'Amit Patel' }
          ]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
