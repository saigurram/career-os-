export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Phase = 'phase1' | 'phase2'
export type ApplicationStatus =
  | 'spotted' | 'interested' | 'applied' | 'recruiter_screen'
  | 'hm_round' | 'loop' | 'offer' | 'negotiating' | 'closed'
export type OutreachStatus = 'drafted' | 'sent' | 'replied' | 'meeting_set' | 'closed'
export type PowType = 'linkedin_post' | 'github_repo' | 'notion_doc' | 'demo_video' | 'product_spec'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          job_title: string
          current_level: string
          current_company: string
          target_level: string
          target_location: string
          relocation_date: string | null
          offer_deadline: string
          phase: Phase
          phase_2_start_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      user_profile: {
        Row: {
          user_id: string
          total_impact_usd: number | null
          years_experience: number
          skill_scores: Json
          genai_baseline_score: number
          last_reassessed_at: string | null
        }
        Insert: Database['public']['Tables']['user_profile']['Row']
        Update: Partial<Database['public']['Tables']['user_profile']['Row']>
      }
      intake_responses: {
        Row: {
          id: string
          user_id: string
          dimension: string
          question: string
          response: string
          score: number
          assessed_at: string
        }
        Insert: Omit<Database['public']['Tables']['intake_responses']['Row'], 'id' | 'assessed_at'>
        Update: Partial<Database['public']['Tables']['intake_responses']['Insert']>
      }
      blocked_names: {
        Row: {
          id: string
          user_id: string
          internal_name: string
          generic_replacement: string
          safe_for_external: boolean
          notes: string | null
          added_at: string
        }
        Insert: Omit<Database['public']['Tables']['blocked_names']['Row'], 'id' | 'added_at'>
        Update: Partial<Database['public']['Tables']['blocked_names']['Insert']>
      }
      curriculum_units: {
        Row: {
          id: string
          unit_number: number
          phase: Phase
          primary_theme: string
          required_ai_concept_tier: number
          pow_type_constraint: PowType | null
          feature_gate: string | null
          is_interview_heavy: boolean
          is_materials_heavy: boolean
        }
        Insert: Omit<Database['public']['Tables']['curriculum_units']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['curriculum_units']['Insert']>
      }
      curriculum_unit_content: {
        Row: {
          id: string
          unit_id: string
          generated_at: string
          learn_resource_title: string
          learn_resource_url: string
          learn_resource_format: string | null
          learn_resource_minutes: number | null
          learn_why: string | null
          learn_prompt: string
          create_task: string
          create_type: PowType
          create_opening_line: string | null
          create_good_looks_like: string | null
          create_nda_note: string | null
          outreach_criteria: string          // stores outreach_who from Claude
          outreach_linkedin_search: string | null
          outreach_message_draft: string | null
          ai_concept_id: string | null
          reflect_question: string
        }
        Insert: Omit<Database['public']['Tables']['curriculum_unit_content']['Row'], 'id' | 'generated_at'>
        Update: Partial<Database['public']['Tables']['curriculum_unit_content']['Insert']>
      }
      user_unit_progress: {
        Row: {
          user_id: string
          unit_id: string
          learn_done: boolean
          create_done: boolean
          outreach_done: boolean
          reflect_done: boolean
          pow_artifact_id: string | null
          notes: string | null
          completed_at: string | null
        }
        Insert: Database['public']['Tables']['user_unit_progress']['Row']
        Update: Partial<Database['public']['Tables']['user_unit_progress']['Row']>
      }
      ai_concepts: {
        Row: {
          id: string
          concept_number: number
          name: string
          tier: number
          description: string
          why_pm_needs_it: string
          covered: boolean
        }
        Insert: Omit<Database['public']['Tables']['ai_concepts']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['ai_concepts']['Insert']>
      }
      user_ai_concept_coverage: {
        Row: {
          user_id: string
          concept_id: string
          covered_in_unit: number
          covered_at: string
        }
        Insert: Database['public']['Tables']['user_ai_concept_coverage']['Row']
        Update: Partial<Database['public']['Tables']['user_ai_concept_coverage']['Row']>
      }
      pow_artifacts: {
        Row: {
          id: string
          user_id: string
          unit_id: string | null
          title: string
          type: PowType
          url: string | null
          published_at: string | null
          skill_dimensions: string[]
          recruiter_description: string | null
          nda_review_passed: boolean
          authenticity_review_passed: boolean
        }
        Insert: Omit<Database['public']['Tables']['pow_artifacts']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['pow_artifacts']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          location: string
          level_estimate: string
          comp_estimate_inr: number | null
          jd_text: string
          source_url: string
          posted_at: string | null
          fetched_at: string
          fit_score: number | null
          fit_analysis: Json | null
          is_active: boolean
          is_remote: boolean
        }
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'fetched_at'>
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
      user_job_actions: {
        Row: {
          user_id: string
          job_id: string
          action: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_job_actions']['Row'], 'created_at'>
        Update: never
      }
      applications: {
        Row: {
          id: string
          user_id: string
          job_id: string
          status: ApplicationStatus
          applied_at: string
          resume_version_id: string | null
          next_action: string | null
          next_action_due: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'applied_at'>
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      outreach_contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          role: string
          company: string
          linkedin_url: string
          rationale: string
          message_draft: string
          status: OutreachStatus
          sent_at: string | null
          replied_at: string | null
          meeting_at: string | null
          unit_number: number | null
        }
        Insert: Omit<Database['public']['Tables']['outreach_contacts']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['outreach_contacts']['Insert']>
      }
      story_bank: {
        Row: {
          id: string
          user_id: string
          title: string
          situation: string
          what_i_drove: string
          outcome: string
          impact_number: string | null
          lp_map: Json
          company_map: Json
          owner_framing_score: number | null
        }
        Insert: Omit<Database['public']['Tables']['story_bank']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['story_bank']['Insert']>
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          version_name: string
          track: string
          content: Json
          created_at: string
          last_used_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['resumes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['resumes']['Insert']>
      }
      interview_sessions: {
        Row: {
          id: string
          user_id: string
          company: string
          round_type: string
          pressure_mode: boolean
          started_at: string
          completed_at: string | null
          overall_score: number | null
          debrief: Json | null
          pattern_analysis: Json | null
        }
        Insert: Omit<Database['public']['Tables']['interview_sessions']['Row'], 'id' | 'started_at'>
        Update: Partial<Database['public']['Tables']['interview_sessions']['Insert']>
      }
      interview_answers: {
        Row: {
          id: string
          session_id: string
          question_text: string
          answer_text: string
          score: number | null
          feedback: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['interview_answers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['interview_answers']['Insert']>
      }
      offers: {
        Row: {
          id: string
          user_id: string
          application_id: string | null
          company: string
          role: string
          base_inr: number
          bonus_inr: number | null
          rsu_inr: number | null
          joining_bonus_inr: number | null
          offered_at: string
          deadline: string | null
          benchmark_data: Json | null
          counter_recommendation: Json | null
          counter_email_draft: string | null
          call_script: string | null
        }
        Insert: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'offered_at'>
        Update: Partial<Database['public']['Tables']['offers']['Insert']>
      }
      interview_questions: {
        Row: {
          id: string
          session_id: string | null
          company: string
          tier: number
          category: 'product_sense' | 'execution_metrics' | 'behavioral' | 'strategy_design'
          question_text: string
          difficulty: number
          lp_map: Json
          tags: string[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['interview_questions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['interview_questions']['Insert']>
      }
      company_playbooks: {
        Row: {
          id: string
          company: string
          tier: number
          interview_format: string
          what_they_test: string
          common_mistakes: string
          insider_tips: string
          user_specific_angle: string
          india_context: Json | null
          comp_context_inr: string | null
          generated_at: string
        }
        Insert: Omit<Database['public']['Tables']['company_playbooks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['company_playbooks']['Insert']>
      }
      human_mock_sessions: {
        Row: {
          id: string
          user_id: string
          unit_number: number
          contact_name: string
          company_context: string
          key_learning: string
          completed_at: string
        }
        Insert: Omit<Database['public']['Tables']['human_mock_sessions']['Row'], 'id' | 'completed_at'>
        Update: Partial<Database['public']['Tables']['human_mock_sessions']['Insert']>
      }
      curriculum_unit_content_history: {
        Row: {
          id: string
          unit_id: string
          user_id: string
          content: Json
          replaced_at: string
          replaced_because: 'manual' | 'smart_refresh' | 'stale'
        }
        Insert: Omit<Database['public']['Tables']['curriculum_unit_content_history']['Row'], 'id' | 'replaced_at'>
        Update: Partial<Database['public']['Tables']['curriculum_unit_content_history']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
