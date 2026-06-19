const TOKKO_KEY = "6db1f124a41e92f4897a3ea8aefb6b1516f4b75b";

let allProps = [];
let offset = 0;
while (true) {
  const res = await fetch(`https://www.tokkobroker.com/api/v1/property/?key=${TOKKO_KEY}&format=json&limit=20&offset=${offset}&lang=es`);
  const data = await res.json();
  const props = data.objects ?? [];
  allProps = allProps.concat(props);
  if (props.length < 20) break;
  offset += 20;
}

// Agrupar por producer
const byProducer = {};
for (const p of allProps) {
  const name = p.producer?.name ?? "Sin producer";
  const id = p.producer?.id ?? "?";
  const key = `${name} (id=${id})`;
  byProducer[key] = (byProducer[key] ?? 0) + 1;
}

console.log("Propiedades por producer en Tokko:");
Object.entries(byProducer).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(` ${v}x ${k}`));
