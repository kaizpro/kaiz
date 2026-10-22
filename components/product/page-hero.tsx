import type { ReactNode } from "react";
import styles from "./product.module.css";

export type ProductMotif = "learning" | "competition" | "ranking" | "practice";

/** Decorative only: never encodes progress, rank or invented product data. */
export function ProductIllustration({ motif }: { motif: ProductMotif }) {
  return <svg viewBox="0 0 360 180" fill="none" aria-hidden="true" focusable="false" className={styles.illustration}>
    <path d="M24 40H336M24 90H336M24 140H336M80 20V160M180 20V160M280 20V160" stroke="currentColor" opacity=".09"/>
    {motif === "ranking" ? <><path d="M70 140V100H130V140M150 140V45H210V140M230 140V75H290V140" stroke="currentColor" strokeWidth="2"/><path d="m166 27 14-12 14 12M180 15V60" stroke="currentColor" strokeWidth="2"/></> : motif === "practice" ? <><path d="m98 62-30 28 30 28m164-56 30 28-30 28M205 45l-40 90" stroke="currentColor" strokeWidth="2.5"/><rect x="32" y="25" width="296" height="130" rx="10" stroke="currentColor" opacity=".22"/></> : <><path d="M34 140H90Q110 140 110 120V90Q110 70 130 70H180Q200 70 200 50V40H320" stroke="currentColor" strokeWidth="2"/><path d="M110 110H210Q230 110 230 130V140H320" stroke="currentColor" opacity=".3" strokeWidth="2"/>{[ [34,140],[110,90],[180,70],[260,40],[320,140] ].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="var(--card)" stroke="currentColor" strokeWidth="2"/>)}{motif === "competition" && <path d="m285 69 12-8 12 8v16l-12 8-12-8V69Z" stroke="currentColor" strokeWidth="2"/>}</>}
  </svg>;
}

export function PageHero({ title, description, motif, children }: { title: string; description: string; motif: ProductMotif; children?: ReactNode }) {
  return <header className={styles.hero}>
    <div className={styles.heroContent}><h1>{title}</h1><p>{description}</p>{children && <div className={styles.actions}>{children}</div>}</div>
    <ProductIllustration motif={motif}/>
  </header>;
}

export function ProductEmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.empty}><span className={styles.emptyMark} aria-hidden="true">—</span><h2>{title}</h2><div>{children}</div></div>;
}
