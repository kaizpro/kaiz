"use server";
import {revalidatePath} from "next/cache";
import {writeSourcePractice} from "@/lib/data/source-practice";
import {archiveSourceHref} from "@/lib/learning/unified-archive";
import type {ProblemActionState} from "@/lib/validation/problem";
export async function saveSourcePractice(catalogId:string,operation:"status"|"create"|"update"|"delete",attemptId:string|null,_:ProblemActionState,form:FormData) {
 const result=await writeSourcePractice(catalogId,operation,attemptId,form);
 if(result.success){revalidatePath(archiveSourceHref(catalogId));revalidatePath("/problems");revalidatePath("/dashboard");}
 return result;
}
