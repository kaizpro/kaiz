const creators = ["Temirlan Zhunussov", "Ali Mendeke", "Bekzhan Zhanatov"];

export function CreatorCredit() {
  return <p aria-label="KAIZ creators" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-[11px] leading-5">
    <span className="text-muted-foreground">Made by</span>
    {creators.map((name, index) => <span key={name} className="inline-flex items-center gap-2 whitespace-nowrap text-foreground/80">
      {index > 0 && <span aria-hidden="true" className="text-muted-foreground">·</span>}
      {name}
    </span>)}
  </p>;
}
