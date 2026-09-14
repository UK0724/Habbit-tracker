import { useState } from "react";
import { apiRequest } from "../../../services/api";
import { getTodayDateString } from "../../../shared/lib/date";
import { useDsaPrepStore } from "../stores/dsaPrepStore";
import { Button } from "../../../components/ui/Button";
export const RevisionPanel = ({problemId}:{problemId:number}) => {
  const entry=useDsaPrepStore(s=>s.solvedProblems.find(p=>p.problemId===problemId));
  const [date,setDate]=useState(entry?.revisionDueDate??"");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  if(!entry)return null;
  const save=async(reviewed:boolean)=>{if(busy)return;setBusy(true);try{await apiRequest("/dsa-prep/revision",{method:"POST",body:JSON.stringify({problemId,revisionDueDate:date,...(reviewed?{reviewedDate:getTodayDateString()}:{})})});await useDsaPrepStore.getState().fetchProfile();setMessage(reviewed?"Revision recorded":"Revision date saved");}catch(e){setMessage(e instanceof Error?e.message:"Could not save. Try again.");}finally{setBusy(false);}};
  return <section className="surface-card space-y-3 p-5"><h2 className="font-semibold">Revisit this problem</h2><p className="text-sm text-content-muted">{entry.revisionDates?.length??0} revision days · First solved {entry.solvedAt.slice(0,10)}</p><label className="field-label">Next revision<input type="date" className="field-input mt-1" value={date} onChange={e=>setDate(e.target.value)}/></label><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={()=>void save(false)}>Save date</Button><Button disabled={busy} variant="secondary" onClick={()=>void save(true)}>Revised today</Button></div>{message&&<p role="status" className="text-sm">{message}</p>}</section>;
};
