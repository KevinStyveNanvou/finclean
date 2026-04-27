// import { NextResponse } from "next/server";

// export async function GET(req: Request, { params }: { params: { scan_id: string } }) {
//   const scan_id = params.scan_id;

//   // Récupérer le token depuis le header
//   const token = req.headers.get("authorization"); // "Bearer XXX"

//   if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

//   // Appel vers backend Django
//   const res = await fetch(`http://127.0.0.1:8000/api/scans/status/${scan_id}/pdf/`, {
//     method: "GET",
//     headers: {
//       Authorization: token,
//     },
//   });

//   if (!res.ok) {
//     const text = await res.text();
//     return NextResponse.json({ error: "Erreur backend", details: text }, { status: res.status });
//   }

//   const arrayBuffer = await res.arrayBuffer();
//   return new Response(arrayBuffer, {
//     headers: {
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename="Scan_${scan_id}.pdf"`,
//     },
//   });
// }