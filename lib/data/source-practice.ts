import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getArchiveSource } from "@/lib/learning/unified-archive";
import { sourceAttemptFields,sourceAttemptSchema } from "@/lib/validation/source-practice";
import { isEditablePractice,problemValidationError,type ProblemActionState } from "@/lib/validation/problem";
import { z } from "zod";
export type SourceSummary={id:string;catalog_id:string;status:"practiced"|"finished";latest_score:number|null;metric:string|null;direction:string|null;last_practiced_at:string|null;updated_at:string|null};
export type SourceAttempt={id:string;raw_score:number|null;attempted_at:string;practice_notes:string|null;practice_metric:string|null;practice_direction:string|null;practice_outcome:string|null;practice_task_title:string|null;practice_task_url:string|null;editable:boolean};
const unavailable="External practice is unavailable. Its required migration may not be released; no empty history or status is assumed.";
export async function getOwnSourceSummaries(ids?:readonly string[]) {
 const user=hasSupabaseEnv()?await getCurrentUser():null;
 if(!user)return {signedIn:false,items:[] as SourceSummary[],count:null,error:null};
 if(ids?.length===0)return {signedIn:true,items:[] as SourceSummary[],count:0,error:null};
 try{const client=await createClient();let query=client.from("own_source_practice").select("id,catalog_id,status,latest_score,metric,direction,last_practiced_at,updated_at",{count:"exact"}).eq("user_id",user.id);
  if(ids?.length)query=query.in("catalog_id",[...ids]);
  const {data,count,error}=await query.order("updated_at",{ascending:false,nullsFirst:false}).limit(ids?100:20);
  if(error||count===null)throw new Error("Unavailable");return {signedIn:true,items:(data??[]) as SourceSummary[],count,error:null};
 }catch{return {signedIn:true,items:[] as SourceSummary[],count:null,error:unavailable};}
}
export async function getOwnSourcePractice(catalogId:string,page=1) {
 const summary=await getOwnSourceSummaries([catalogId]);
 const empty={...summary,attempts:[] as SourceAttempt[],attemptCount:0};if(!summary.signedIn||summary.error)return empty;
 try{const user=await getCurrentUser();if(!user)return {...empty,signedIn:false};const client=await createClient();
  const target=await client.from("source_practice").select("id").eq("user_id",user.id).eq("catalog_id",catalogId).maybeSingle();if(target.error)throw new Error("Unavailable");if(!target.data)return empty;
  const {data,count,error}=await client.from("problem_performances").select("id,raw_score,attempted_at,practice_notes,practice_metric,practice_direction,practice_outcome,practice_task_title,practice_task_url,status,normalized_performance,source_provider,source_external_id,source_provenance",{count:"exact"}).eq("user_id",user.id).eq("source_practice_id",target.data.id).eq("attempt_type","practice").order("attempted_at",{ascending:false}).order("id").range((page-1)*20,page*20-1);
  if(error)throw new Error("Unavailable");return {...summary,attemptCount:count??0,attempts:(data??[]).map(row=>({...row,editable:isEditablePractice(row)})) as SourceAttempt[]};
 }catch{return {...empty,error:unavailable};}
}
export async function writeSourcePractice(catalogId:string,operation:"status"|"create"|"update"|"delete",attemptId:string|null,form:FormData):Promise<ProblemActionState> {
 const user=await getCurrentUser();if(!user)return {error:"Sign in to record private practice."};
 if(!z.enum(["status","create","update","delete"]).safeParse(operation).success||typeof catalogId!=="string"||!getArchiveSource(catalogId)||attemptId!==null&&!z.uuid().safeParse(attemptId).success||["update","delete"].includes(operation)&&attemptId===null)return {error:"Invalid source or attempt."};
 const client=await createClient();
 try{
  if(operation==="status"){
   const status=form.get("status");if(!["practiced","finished","clear"].includes(String(status)))return {error:"Choose a valid self-reported collection status."};
   const result=status==="clear"?await client.from("source_practice").update({status:null}).eq("user_id",user.id).eq("catalog_id",catalogId):await client.rpc("ensure_source_practice",{p_catalog_id:catalogId,p_status:status});
   return result.error?{error:"Status could not be confirmed. Refresh before retrying."}:{success:"Private collection status saved. Clearing status preserves recorded attempts."};
  }
  if(operation==="delete"&&form.get("confirm")!=="true")return {error:"Confirm deletion of this private attempt."};
  const parsed=operation==="delete"?null:sourceAttemptSchema.safeParse(Object.fromEntries(sourceAttemptFields.map(key=>[key,form.get(key)])));
  if(parsed&&!parsed.success)return problemValidationError(parsed.error);
  let targetId:string;
  if(operation==="create"){
   const target=await client.rpc("ensure_source_practice",{p_catalog_id:catalogId,p_status:null});if(target.error||typeof target.data!=="string")return {error:unavailable};targetId=target.data;
  }else{
   const target=await client.from("source_practice").select("id").eq("user_id",user.id).eq("catalog_id",catalogId).maybeSingle();if(target.error||!target.data)return {error:"Private practice not found."};targetId=target.data.id;
   const attempt=await client.from("problem_performances").select("status,normalized_performance,source_provider,source_external_id,source_provenance").eq("id",attemptId).eq("user_id",user.id).eq("source_practice_id",targetId).eq("attempt_type","practice").maybeSingle();
   if(attempt.error||!attempt.data||!isEditablePractice(attempt.data))return {error:"Only your editable self-reported attempt can be changed."};
  }
  const query=operation==="create"?client.from("problem_performances").insert({user_id:user.id,source_practice_id:targetId,attempt_type:"practice",...(parsed?.success?parsed.data:{})}):operation==="update"?client.from("problem_performances").update(parsed?.success?parsed.data:{}):client.from("problem_performances").delete();
  const scoped=operation==="create"?query:query.eq("id",attemptId).eq("user_id",user.id).eq("source_practice_id",targetId).eq("attempt_type","practice");
  const {data,error}=await scoped.select("id").maybeSingle();return error||!data?{error:"Practice could not be changed. Refresh before retrying."}:{success:operation==="delete"?"Private attempt deleted.":"Self-reported practice saved."};
 }catch{return {error:unavailable};}
}
