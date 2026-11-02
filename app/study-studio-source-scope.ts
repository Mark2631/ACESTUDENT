export type SourceScopeItem={id:string;name:string};
const SOURCE_HEADER=/^SOURCE:\s*(.+)$/im;
const SOURCE_ID=/\[ACE_SOURCE_ID=([^\]]+)\]/i;
function normalizedName(value:string):string{return value.replace(SOURCE_ID,"").trim().toLowerCase()}
export function getScopedNotebookText(fullText:string,sources:SourceScopeItem[],disabledIds:ReadonlySet<string>):string{
 if(!sources.length||!disabledIds.size)return fullText;
 const byName=new Map(sources.map(item=>[normalizedName(item.name),item.id]));
 const included=fullText.split(/(?=^SOURCE:\s*.+$)/im).filter(block=>{
  const header=block.match(SOURCE_HEADER)?.[1]?.trim();
  if(!header)return true; // Preserve independently entered notebook notes.
  const stableId=header.match(SOURCE_ID)?.[1];
  const matchedId=stableId??byName.get(normalizedName(header));
  return !matchedId||!disabledIds.has(matchedId);
 });
 return included.join("").trim();
}
