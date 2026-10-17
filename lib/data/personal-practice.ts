import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export type RecentPractice = { id:string; raw_score:number; attempted_at:string; status:string; problem:{title:string;slug:string;metric_name:string;published:boolean}|null };
export async function getOwnRecentPractice() {
  const user=await getCurrentUser(); if(!user)return {attempts:[] as RecentPractice[],count:0,error:null};
  const client=await createClient();
  const {data,count,error}=await client.from("problem_performances")
    .select("id,raw_score,attempted_at,status,problem:problems!problem_performances_problem_id_fkey(title,slug,metric_name,published)",{count:"exact"})
    .eq("user_id",user.id).eq("attempt_type","practice")
    .order("attempted_at",{ascending:false}).order("id",{ascending:true}).limit(20);
  return {attempts:(data??[]) as unknown as RecentPractice[],count:count??0,error:error?"Private practice is unavailable. No empty history is assumed.":null};
}
