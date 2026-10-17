import type { LearningResource } from "@/lib/learning/curriculum";
import styles from "./lesson.module.css";
const labels: Record<LearningResource["kind"],string> = { article:"article",video:"video",exercise:"exercise",course:"course",documentation:"documentation",notebook:"examples" };
export function LessonMaterials({ resources }: { resources: readonly LearningResource[] }) {
  return <ol className={styles.materials} aria-label="Ordered learning materials">{resources.map((resource,index)=>{
    let url: URL; try { url=new URL(resource.href); } catch { return null; }
    if(url.protocol!=="https:"||url.username||url.password)return null;
    const unavailable=resource.availability==="unavailable"||resource.availability==="challenge";
    return <li className={styles.material} key={resource.id}><h3>{index+1}. {resource.title}</h3><div className={styles.meta}><span>{labels[resource.kind]}</span><span>{resource.provider??url.hostname.replace(/^www\./,"")}</span>{resource.account&&<span>{resource.account}</span>}</div>
      {unavailable ? <p>{resource.availability==="challenge"?"Access unverified":"Unavailable"} · No active resource link is shown. See source details.</p> : <a className={styles.button} href={resource.href} target="_blank" rel="noopener noreferrer" aria-label={`Open material: ${resource.title} (new tab)`}>Open {labels[resource.kind]} ↗</a>}
      <details className={styles.details}><summary className={styles.button}>View source details</summary>{resource.description&&<p>{resource.description}</p>}{resource.provenance&&<p>Selection: {resource.provenance}</p>}{unavailable&&<p>The last recorded check could not verify access. This is not a claim that you can open the resource now.</p>}</details>
    </li>;
  })}</ol>;
}
