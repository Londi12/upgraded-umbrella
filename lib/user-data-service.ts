import { supabase, hasValidCredentials } from "./supabase"
import type { CVData, CoverLetterData } from "@/types/cv-types"

export interface UserProfile {
  id?: string
  user_id?: string
  personal_info: any
  experience: any[]
  education: any[]
  skills: string
  summary: string
  created_at?: string
  updated_at?: string
}

export interface SavedCV {
  id?: string
  user_id?: string
  name: string
  template_type: string
  template_name: string
  cv_data: CVData
  created_at?: string
  updated_at?: string
}

export interface SavedCoverLetter {
  id?: string
  user_id?: string
  name: string
  template_type: string
  template_name: string
  cover_letter_data: CoverLetterData
  created_at?: string
  updated_at?: string
}

// User Profile Management
export const getUserProfile = async () => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase.from("user_profiles").select("*").single()

  return { data, error }
}

export const createOrUpdateUserProfile = async (profileData: Partial<UserProfile>) => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: "Not authenticated" } }

  // Try to get existing profile first
  const { data: existingProfile } = await supabase.from("user_profiles").select("*").single()

  if (existingProfile) {
    // Update existing profile
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        personal_info: profileData.personal_info,
        experience: profileData.experience,
        education: profileData.education,
        skills: profileData.skills,
        summary: profileData.summary,
      })
      .eq("user_id", user.id)
      .select()
      .single()

    return { data, error }
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        personal_info: profileData.personal_info || {},
        experience: profileData.experience || [],
        education: profileData.education || [],
        skills: profileData.skills || "",
        summary: profileData.summary || "",
      })
      .select()
      .single()

    return { data, error }
  }
}

// CV Management
export const getSavedCVs = async () => {
  if (!hasValidCredentials) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase.from("saved_cvs").select("*").order("updated_at", { ascending: false })

  return { data: data || [], error }
}

export const saveCV = async (cvData: Omit<SavedCV, "id" | "user_id" | "created_at" | "updated_at">) => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: "Not authenticated" } }

  const { data, error } = await supabase
    .from("saved_cvs")
    .insert({
      user_id: user.id,
      ...cvData,
    })
    .select()
    .single()

  return { data, error }
}

export const updateCV = async (id: string, cvData: Partial<SavedCV>) => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase.from("saved_cvs").update(cvData).eq("id", id).select().single()

  return { data, error }
}

export const deleteCV = async (id: string) => {
  if (!hasValidCredentials) {
    return { error: null }
  }

  const { error } = await supabase.from("saved_cvs").delete().eq("id", id)

  return { error }
}

// Cover Letter Management
export const getSavedCoverLetters = async () => {
  if (!hasValidCredentials) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from("saved_cover_letters")
    .select("*")
    .order("updated_at", { ascending: false })

  return { data: data || [], error }
}

export const saveCoverLetter = async (
  coverLetterData: Omit<SavedCoverLetter, "id" | "user_id" | "created_at" | "updated_at">,
) => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: "Not authenticated" } }

  const { data, error } = await supabase
    .from("saved_cover_letters")
    .insert({
      user_id: user.id,
      ...coverLetterData,
    })
    .select()
    .single()

  return { data, error }
}

export const updateCoverLetter = async (id: string, coverLetterData: Partial<SavedCoverLetter>) => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from("saved_cover_letters")
    .update(coverLetterData)
    .eq("id", id)
    .select()
    .single()

  return { data, error }
}

export const deleteCoverLetter = async (id: string) => {
  if (!hasValidCredentials) {
    return { error: null }
  }

  const { error } = await supabase.from("saved_cover_letters").delete().eq("id", id)

  return { error }
}

// Account Deletion
export const deleteUserAccount = async () => {
  if (!hasValidCredentials) {
    return { error: null }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: { message: "Not authenticated" } }

  // Delete user data (cascading deletes will handle related records)
  const { error: profileError } = await supabase.from("user_profiles").delete().eq("user_id", user.id)

  if (profileError) {
    return { error: profileError }
  }

  // Delete the auth user (this will cascade delete all related data)
  const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

  return { error: authError }
}
