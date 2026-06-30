import { Link } from "wouter";
import { Shield, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#e8e8e2", color: "#130537" }}>
      <div className="max-w-md w-full p-8 border-4 border-[#130537] bg-[#e8e8e2] text-center" style={{ boxShadow: "8px 8px 0px 0px #130537" }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#130537] bg-[#130537] mx-auto mb-6">
          <Shield className="h-6 w-6 text-[#a3e635]" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2 text-[#a3e635] bg-[#130537] py-1 px-3 inline-block">
          // ERROR CODE 404
        </p>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-4">
          Entity Not Found
        </h1>
        <p className="text-sm mb-6 leading-relaxed text-slate-700">
          The routing table returned a null response for this URI. The requested resource might have been deleted or archived.
        </p>
        <Link href="/dashboard">
          <button
            className="w-full py-3 text-[14px] font-bold border-2 border-[#130537] transition-all hover:bg-[#a3e635] hover:border-[#130537] flex items-center justify-center gap-2"
            style={{ backgroundColor: "#130537", color: "#e8e8e2" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#a3e635";
              (e.currentTarget as HTMLButtonElement).style.color = "#130537";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#130537";
              (e.currentTarget as HTMLButtonElement).style.color = "#e8e8e2";
            }}
          >
            Return to Headquarters <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
