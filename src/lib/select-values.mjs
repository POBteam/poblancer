// Display native saved values without rewriting them to a different current option.
export function selectPresentation(value,options=[],multiple=false,selectedValue){
 const scalar=v=>(typeof v==='string'||typeof v==='number')?String(v):'';
 const values=(Array.isArray(value)?value:[value]).map(scalar).filter(Boolean);
 const selected=multiple?values:(Array.isArray(value)?(values.includes(String(selectedValue))?String(selectedValue):values[0]||''):scalar(value));
 const rendered=[...options],known=new Set(rendered.map(o=>String(o.value)));
 for(const saved of multiple?selected:[selected])if(saved&&!known.has(saved)){rendered.push({value:saved,label:saved});known.add(saved);}
 return {value:selected,options:rendered};
}
