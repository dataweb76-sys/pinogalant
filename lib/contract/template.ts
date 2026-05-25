// lib/contract/template.ts
// Generador de contrato de alquiler estándar argentino
// Adaptado a Ley 27.551 y sus modificaciones

export interface ContractData {
  // Referencia
  referenceCode: string;
  startDate: Date;
  endDate:   Date;

  // Partes
  landlordName:    string;
  landlordDni:     string;
  landlordAddress: string;
  tenantName:      string;
  tenantDni:       string;
  tenantAddress:   string;
  agentName?:      string;
  agentCuit?:      string;

  // Inmueble
  propertyAddress:     string;
  propertyCity:        string;
  propertyProvince:    string;
  propertyDescription: string;
  propertyType:        string;
  propertyRooms?:      number;
  propertyBathrooms?:  number;
  propertyM2?:         number;

  // Condiciones económicas
  monthlyRentArs:     number;
  monthlyRentUsd?:    number;
  expensesArs:        number;
  depositMonths:      number;
  depositAmountArs:   number;
  taxesIncluded:      boolean;
  waterIncluded:      boolean;
  gasIncluded:        boolean;
  electricityIncluded: boolean;

  // Plazos de pago
  paymentDueDay:    number;   // día del mes
  gracePeriodDays:  number;
  durationMonths:   number;

  // Ajuste de precio
  priceIncreasePct:    number;
  priceIncreaseMonths: number;

  // Cláusulas adicionales
  additionalClauses?: string;

  // Aceptación
  tenantAgreedAt?: Date;
  tenantIp?:       string;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function months(n: number): string {
  return `${n} (${numToWords(n)}) ${n === 1 ? "mes" : "meses"}`;
}

function numToWords(n: number): string {
  const words: Record<number, string> = {
    1: "uno", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco",
    6: "seis", 7: "siete", 8: "ocho", 9: "nueve", 10: "diez",
    11: "once", 12: "doce", 18: "dieciocho", 24: "veinticuatro",
    36: "treinta y seis", 48: "cuarenta y ocho",
  };
  return words[n] ?? String(n);
}

export function generateContractHTML(d: ContractData): string {
  const today        = fmtDate(new Date());
  const startFmt     = fmtDate(d.startDate);
  const endFmt       = fmtDate(d.endDate);
  const rentFmt      = fmt(d.monthlyRentArs);
  const expFmt       = fmt(d.expensesArs);
  const depositFmt   = fmt(d.depositAmountArs);

  const incluidos: string[] = [];
  if (d.taxesIncluded)       incluidos.push("impuestos municipales");
  if (d.waterIncluded)       incluidos.push("servicio de agua");
  if (d.gasIncluded)         incluidos.push("servicio de gas");
  if (d.electricityIncluded) incluidos.push("servicio de electricidad");

  const incluidosText = incluidos.length > 0
    ? `El precio incluye: ${incluidos.join(", ")}. Los demás servicios corren por cuenta del locatario.`
    : "Los servicios de agua, gas, electricidad e impuestos corren por cuenta exclusiva del locatario.";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Contrato de Locación – ${d.referenceCode}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 13px;
    line-height: 1.75;
    color: #1a1a1a;
    background: #fff;
    padding: 48px 56px;
    max-width: 840px;
    margin: 0 auto;
  }
  .header {
    text-align: center;
    border-bottom: 3px solid #2D3134;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  .header .logo { font-size: 22px; font-weight: 900; color: #2D3134; letter-spacing: -0.5px; }
  .header .logo span { color: #B48A73; }
  .header .subtitle { font-size: 11px; color: #888; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  h1 { font-size: 18px; text-align: center; margin: 24px 0 6px; text-transform: uppercase; letter-spacing: 1px; }
  .ref { text-align: center; font-size: 12px; color: #666; margin-bottom: 30px; }
  h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #2D3134;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
    margin: 28px 0 12px;
  }
  p { margin-bottom: 10px; text-align: justify; }
  .highlight { background: #fffbeb; border-left: 3px solid #B48A73; padding: 10px 14px; margin: 12px 0; font-style: italic; }
  .table-data { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .table-data td { padding: 6px 10px; border: 1px solid #ddd; font-size: 12px; }
  .table-data td:first-child { font-weight: bold; background: #f9f9f9; width: 40%; }
  .firma-box {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 24px 20px;
    margin: 16px 0;
    text-align: center;
    background: #fafafa;
  }
  .firma-box .name { font-weight: bold; margin-top: 40px; border-top: 1px solid #999; padding-top: 6px; display: inline-block; min-width: 220px; }
  .acceptance-box {
    background: #f0fdf4;
    border: 2px solid #86efac;
    border-radius: 10px;
    padding: 16px 20px;
    margin: 20px 0;
    font-size: 12px;
  }
  .acceptance-box strong { color: #15803d; }
  .page-break { page-break-before: always; }
  ul { margin: 8px 0 10px 24px; }
  li { margin-bottom: 4px; }
  @media print {
    body { padding: 20px 30px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo">PINO <span>GALANT</span></div>
  <div class="subtitle">Inmobiliaria · Santa Rosa, La Pampa</div>
</div>

<h1>Contrato de Locación de Inmueble</h1>
<div class="ref">Referencia: <strong>${d.referenceCode}</strong> · Generado: ${today}</div>

<!-- PARTES -->
<h2>I. Partes del contrato</h2>
<table class="table-data">
  <tr><td>LOCADOR (propietario)</td><td>${d.landlordName} · DNI/CUIT ${d.landlordDni}</td></tr>
  <tr><td>Domicilio del Locador</td><td>${d.landlordAddress}</td></tr>
  <tr><td>LOCATARIO (inquilino)</td><td>${d.tenantName} · DNI/CUIT ${d.tenantDni}</td></tr>
  <tr><td>Domicilio del Locatario</td><td>${d.tenantAddress}</td></tr>
  ${d.agentName ? `<tr><td>Agente Inmobiliario</td><td>${d.agentName}${d.agentCuit ? ` · CUIT ${d.agentCuit}` : ""}</td></tr>` : ""}
</table>

<!-- INMUEBLE -->
<h2>II. Inmueble objeto del contrato</h2>
<table class="table-data">
  <tr><td>Dirección</td><td>${d.propertyAddress}, ${d.propertyCity}, ${d.propertyProvince}</td></tr>
  <tr><td>Tipo</td><td>${d.propertyType}</td></tr>
  ${d.propertyRooms    ? `<tr><td>Habitaciones</td><td>${d.propertyRooms}</td></tr>` : ""}
  ${d.propertyBathrooms ? `<tr><td>Baños</td><td>${d.propertyBathrooms}</td></tr>` : ""}
  ${d.propertyM2       ? `<tr><td>Superficie cubierta</td><td>${d.propertyM2} m²</td></tr>` : ""}
  <tr><td>Descripción</td><td>${d.propertyDescription}</td></tr>
</table>

<!-- DESTINO -->
<h2>III. Destino</h2>
<p>El inmueble descripto será destinado exclusivamente al uso habitacional del Locatario y su grupo familiar conviviente. Queda expresamente prohibido su uso para actividades comerciales, industriales o de cualquier otro tipo que no sea el residencial pactado, salvo autorización escrita previa del Locador.</p>

<!-- PLAZO -->
<h2>IV. Plazo de la locación</h2>
<p>El plazo de la presente locación es de <strong>${months(d.durationMonths)}</strong>, con inicio el <strong>${startFmt}</strong> y vencimiento el <strong>${endFmt}</strong>.</p>
<p>De conformidad con la Ley N° 27.551 y sus modificatorias, el plazo mínimo de locación de inmuebles destinados a uso habitacional es de tres (3) años. Las partes acuerdan el plazo estipulado ut supra.</p>
<p>Vencido el plazo, el Locatario deberá restituir el inmueble en las condiciones en que lo recibió, salvo el desgaste normal por uso adecuado. La continuación en la ocupación del inmueble sin la celebración de un nuevo contrato importará una locación por tiempo indeterminado, pudiendo cualquiera de las partes ponerle fin con el preaviso previsto por ley.</p>

<!-- PRECIO Y PAGO -->
<h2>V. Precio y forma de pago</h2>
<div class="highlight">
  <strong>Canon mensual: ${rentFmt}</strong><br/>
  ${d.monthlyRentUsd ? `Equivalente aproximado: USD ${d.monthlyRentUsd.toLocaleString("es-AR")} (referencial, se abona en pesos al tipo de cambio oficial del Banco Nación al día de pago).<br/>` : ""}
  Vencimiento: día <strong>${d.paymentDueDay}</strong> de cada mes.
  ${d.gracePeriodDays > 0 ? ` Período de gracia: ${d.gracePeriodDays} días corridos.` : ""}
</div>
<p>El pago del canon locativo deberá realizarse por adelantado, entre los días 1° y ${d.paymentDueDay} de cada mes. Los pagos se realizarán mediante:</p>
<ul>
  <li>Transferencia bancaria a la cuenta informada por el Locador o la inmobiliaria.</li>
  <li>Pago en efectivo en las oficinas de Pino Galant Inmobiliaria, en el horario de atención al público, previa coordinación.</li>
  <li>Plataforma de pago digital habilitada en el portal del inquilino.</li>
</ul>
<p>En todos los casos, el Locatario recibirá el recibo correspondiente. El pago fuera del período acordado generará un recargo del 2% mensual sobre el monto adeudado por cada período de mora.</p>
<p>${incluidosText}</p>
${d.expensesArs > 0 ? `<p>Expensas ordinarias del período: ${expFmt} mensuales, sujeto a variación según liquidación del consorcio, abonadas juntamente con el canon.</p>` : ""}

<!-- AJUSTE DE PRECIO -->
<h2>VI. Actualización del precio</h2>
<p>El canon locativo se actualizará cada <strong>${d.priceIncreaseMonths} (${numToWords(d.priceIncreaseMonths)}) meses</strong> de vigencia del contrato, en un porcentaje del <strong>${d.priceIncreasePct}%</strong> acumulativo, o según el Índice para Contratos de Locación (ICL) publicado por el Banco Central de la República Argentina (BCRA), aplicándose el que resulte mayor, conforme lo establecido en la Ley N° 27.551.</p>
<p>El Locador o la inmobiliaria notificará al Locatario el nuevo valor con al menos diez (10) días de anticipación a la fecha de aplicación. La falta de notificación no liberará al Locatario de la obligación de pago del ajuste correspondiente una vez notificado.</p>

<!-- DEPÓSITO -->
<h2>VII. Depósito en garantía</h2>
<p>Al momento de la firma del presente contrato, el Locatario entrega en concepto de depósito en garantía la suma de <strong>${depositFmt}</strong> (equivalente a ${d.depositMonths === 1 ? "un mes" : `${d.depositMonths} meses`} de canon), conforme lo permitido por la normativa vigente.</p>
<p>Dicho depósito será restituido al Locatario dentro de los treinta (30) días hábiles posteriores a la restitución del inmueble, previa deducción de los montos correspondientes a daños que excedan el uso normal y adecuado del bien, o deudas de cualquier naturaleza que correspondan al Locatario.</p>

<!-- OBLIGACIONES LOCATARIO -->
<h2>VIII. Obligaciones del Locatario</h2>
<ul>
  <li>Abonar el canon locativo en tiempo y forma en los plazos estipulados.</li>
  <li>Abonar las expensas ordinarias del período que correspondan al inmueble, si aplicare.</li>
  <li>Conservar el inmueble en buen estado, realizando las reparaciones locativas a su cargo (Art. 1° Ley 27.551).</li>
  <li>No realizar modificaciones, refacciones ni construcciones sin autorización escrita del Locador.</li>
  <li>No ceder el contrato ni subarrendar el inmueble total o parcialmente sin autorización escrita del Locador.</li>
  <li>Dar aviso inmediato al Locador o a la inmobiliaria de cualquier desperfecto, avería o daño que requiera reparación, bajo pena de responder por los daños que se originen por su omisión.</li>
  <li>Permitir el acceso del Locador o sus representantes al inmueble para efectuar inspecciones o reparaciones necesarias, con previo aviso razonable (no menor a 48 horas, salvo emergencias).</li>
  <li>No destinar el inmueble a fin distinto del pactado.</li>
  <li>Restituir el inmueble al vencimiento del contrato en las mismas condiciones en que lo recibió, salvo el desgaste propio del uso normal.</li>
</ul>

<!-- OBLIGACIONES LOCADOR -->
<h2>IX. Obligaciones del Locador</h2>
<ul>
  <li>Entregar el inmueble en condiciones adecuadas de habitabilidad al inicio de la locación.</li>
  <li>Mantener el inmueble en condiciones que sirvan al uso convenido y efectuar las reparaciones que no correspondan al Locatario.</li>
  <li>Garantizar el uso pacífico del inmueble durante toda la vigencia del contrato.</li>
  <li>Otorgar recibo de cada pago realizado por el Locatario.</li>
  <li>Reintegrar el depósito en garantía dentro del plazo estipulado.</li>
</ul>

<!-- RESCISIÓN ANTICIPADA -->
<h2>X. Rescisión anticipada</h2>
<p>El Locatario podrá rescindir anticipadamente el contrato, notificando fehacientemente al Locador con una anticipación mínima de <strong>30 días corridos</strong>, en las siguientes condiciones:</p>
<ul>
  <li>Si la rescisión se produce <strong>antes de los 6 meses</strong> de vigencia: deberá abonar el equivalente a 1,5 meses de alquiler en concepto de indemnización.</li>
  <li>Si la rescisión se produce <strong>después de los 6 meses</strong> de vigencia: deberá abonar el equivalente a 1 mes de alquiler en concepto de indemnización.</li>
</ul>
<p>La falta de preaviso de 30 días no eximirá al Locatario del pago de los cánones hasta la efectiva restitución del inmueble.</p>
<p>El Locador sólo podrá rescindir el contrato por las causales establecidas en la ley vigente, entre ellas: falta de pago, uso indebido del inmueble, o cesión o sublocación sin autorización.</p>

<!-- REPARACIONES -->
<h2>XI. Reparaciones y mantenimiento</h2>
<p>Las reparaciones locativas (aquellas que se producen por el uso normal del inmueble y son de escasa importancia económica) estarán a cargo del Locatario. Las reparaciones urgentes o estructurales estarán a cargo del Locador, quien deberá realizarlas en tiempo razonable luego de ser notificado.</p>
<p>En caso de que el Locador no realice las reparaciones a su cargo dentro de los 30 días corridos de la notificación fehaciente, el Locatario podrá realizarlas por su cuenta y descontarlas del canon, previa notificación y justificación de los gastos con comprobantes.</p>

<!-- PROHIBICIONES -->
<h2>XII. Prohibiciones</h2>
<p>Queda expresamente prohibido al Locatario:</p>
<ul>
  <li>Ceder el contrato o subarrendar el inmueble sin autorización escrita del Locador.</li>
  <li>Realizar actividades molestas, ruidosas o contrarias a la moral y las buenas costumbres.</li>
  <li>Modificar la estructura del inmueble sin autorización escrita.</li>
  <li>Instalar carteles, avisos o antenas sin autorización.</li>
  <li>Depositar materiales peligrosos, inflamables o prohibidos por la normativa vigente.</li>
  ${!d.propertyDescription.toLowerCase().includes("mascota") ? '<li>Tener animales domésticos sin consentimiento previo y por escrito del Locador (salvo pacto en contrario).</li>' : ""}
</ul>

<!-- CLÁUSULAS ADICIONALES -->
${d.additionalClauses ? `
<h2>XIII. Cláusulas adicionales</h2>
<p>${d.additionalClauses.replace(/\n/g, "</p><p>")}</p>
` : ""}

<!-- DOMICILIOS -->
<h2>XIV. Domicilios especiales</h2>
<p>Las partes constituyen domicilios especiales a los efectos de este contrato:</p>
<ul>
  <li><strong>Locador:</strong> ${d.landlordAddress}</li>
  <li><strong>Locatario:</strong> El inmueble objeto de este contrato durante la vigencia del mismo, y posteriormente ${d.tenantAddress}.</li>
  ${d.agentName ? `<li><strong>Inmobiliaria:</strong> Pino Galant – Santa Rosa, La Pampa.</li>` : ""}
</ul>
<p>Toda notificación entre las partes deberá realizarse al domicilio aquí constituido o mediante correo electrónico con confirmación de recepción.</p>

<!-- COMPETENCIA -->
<h2>XV. Ley aplicable y jurisdicción</h2>
<p>El presente contrato se rige por las disposiciones de la Ley N° 27.551, el Código Civil y Comercial de la Nación, y demás normativa aplicable. Para cualquier controversia que se suscite, las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad de Santa Rosa, Provincia de La Pampa, renunciando a cualquier otro fuero o jurisdicción que pudiere corresponderles.</p>

<!-- ACUERDO -->
<h2>XVI. Conformidad de las partes</h2>
<p>Leído y entendido el presente instrumento, las partes lo firman en señal de conformidad, en dos (2) ejemplares de un mismo tenor y a un solo efecto, en la Ciudad de Santa Rosa, Provincia de La Pampa, a los ${today}.</p>

<div style="display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:40px;">
  <div class="firma-box">
    <p>_____________________________</p>
    <div class="name">${d.landlordName}<br/><small>LOCADOR · DNI ${d.landlordDni}</small></div>
  </div>
  <div class="firma-box">
    <p>_____________________________</p>
    <div class="name">${d.tenantName}<br/><small>LOCATARIO · DNI ${d.tenantDni}</small></div>
  </div>
</div>
${d.agentName ? `
<div class="firma-box" style="margin-top:20px; max-width:300px;">
  <p>_____________________________</p>
  <div class="name">${d.agentName}<br/><small>AGENTE INMOBILIARIO</small></div>
</div>
` : ""}

<!-- ACEPTACIÓN DIGITAL -->
${d.tenantAgreedAt ? `
<div class="acceptance-box">
  <strong>✅ Aceptación digital registrada</strong><br/>
  El Locatario <strong>${d.tenantName}</strong> aceptó los términos del presente contrato en forma electrónica<br/>
  el día <strong>${fmtDate(d.tenantAgreedAt)}</strong> a las ${d.tenantAgreedAt.toLocaleTimeString("es-AR")} (hora Argentina).
  ${d.tenantIp ? `<br/>IP registrada: ${d.tenantIp}` : ""}
  <br/><small style="color:#666;">De conformidad con la Ley N° 25.506 de Firma Digital, esta aceptación tiene plena validez legal.</small>
</div>
` : ""}

<div style="margin-top:40px; text-align:center; font-size:10px; color:#aaa; border-top:1px solid #eee; padding-top:16px;">
  Documento generado por el sistema de gestión de Pino Galant Inmobiliaria · ${d.referenceCode}<br/>
  Versión digital — Conservar impreso firmado por ambas partes como instrumento original.
</div>

</body>
</html>
`.trim();
}
