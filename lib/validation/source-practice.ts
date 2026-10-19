import { z } from "zod";
import { practiceSchema, validatePracticeScore } from "./problem";
const optionalText=(max:number,min=0)=>z.preprocess(v=>v==null||typeof v==="string"&&!v.trim()?null:v,z.string().trim().min(min).max(max).nullable());
export function safePracticeUrl(value:string) {
  try {const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password&&!/^(localhost|0\.|10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(url.hostname)&&url.hostname.includes(".")&&!/[\s]/.test(value)&&!/^\/t\//.test(url.pathname)&&![...url.searchParams.keys()].some(key=>/token|password|secret|code|key/i.test(key));}catch{return false;}
}
export const sourceAttemptSchema=z.object({
  raw_score:z.preprocess(v=>v==null||v===""?null:v,practiceSchema.shape.raw_score.nullable()),
  attempted_at:practiceSchema.shape.attempted_at,
  practice_notes:optionalText(2000),practice_metric:optionalText(80),
  practice_direction:z.preprocess(v=>v==null||v===""?null:v,z.enum(["higher_is_better","lower_is_better"]).nullable()),
  practice_outcome:z.enum(["practiced","participated","finished","solved"]),
  practice_task_title:optionalText(180,2),
  practice_task_url:optionalText(2000).refine(v=>v===null||safePracticeUrl(v),"Use a public HTTPS URL without credentials, invitation tokens or private hosts"),
}).superRefine((data,ctx)=>{
  if(data.raw_score!==null){if(!data.practice_metric)ctx.addIssue({code:"custom",path:["practice_metric"],message:"Specify the metric/unit for your reported score"});else{const error=validatePracticeScore(data.raw_score,data.practice_metric);if(error)ctx.addIssue({code:"custom",path:["raw_score"],message:error});}}
  if(data.practice_outcome==="solved"&&!data.practice_task_title)ctx.addIssue({code:"custom",path:["practice_task_title"],message:"Name the individual task; a whole collection is not a solved problem"});
  if(data.practice_task_url&&!data.practice_task_title)ctx.addIssue({code:"custom",path:["practice_task_title"],message:"Name the linked task"});
});
export const sourceAttemptFields=["raw_score","attempted_at","practice_notes","practice_metric","practice_direction","practice_outcome","practice_task_title","practice_task_url"] as const;
