import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FamilyMemberProfile {
  id: string;
  user_id: string;
  name: string;
  birth_date: string | null;
  photo_url: string | null;
  color: string;
  dietary_requirements: string[];
  likes: string[];
  dislikes: string[];
  hobbies: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Calculates age from a birth date string (YYYY-MM-DD) */
export const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const MEMBER_COLORS = [
  "hsl(175 26% 34%)",
  "hsl(17 51% 58%)",
  "hsl(103 20% 45%)",
  "hsl(260 50% 55%)",
  "hsl(340 55% 55%)",
  "hsl(30 70% 55%)",
  "hsl(200 60% 45%)",
  "hsl(50 70% 50%)",
];

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMembers((data as FamilyMemberProfile[]) || []);
    } catch (err) {
      console.error("Failed to fetch family members:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (member: Omit<FamilyMemberProfile, "id" | "user_id" | "created_at" | "updated_at">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("family_members")
      .insert({ ...member, user_id: session.user.id })
      .select()
      .single();

    if (error) throw error;
    setMembers(prev => [...prev, data as FamilyMemberProfile]);
    return data as FamilyMemberProfile;
  };

  const updateMember = async (id: string, updates: Partial<FamilyMemberProfile>) => {
    const { data, error } = await supabase
      .from("family_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    setMembers(prev => prev.map(m => m.id === id ? (data as FamilyMemberProfile) : m));
    return data as FamilyMemberProfile;
  };

  const deleteMember = async (id: string) => {
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", id);

    if (error) throw error;
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return { members, loading, fetchMembers, addMember, updateMember, deleteMember };
}
